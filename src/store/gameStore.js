import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import playersData from '../data/players.json';

/* ─── Helpers ─── */

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getClubTier = (club) => {
  const ovr = club.overallRating || 75;
  if (ovr >= 85) return 'elite';
  if (ovr >= 80) return 'strong';
  if (ovr >= 75) return 'mid';
  return 'lower';
};

const TIER_OBJECTIVES = {
  elite:  ['Win the league title', 'Reach the Champions League final', 'Keep wage bill under control', 'Maintain squad depth'],
  strong: ['Finish in the top 4', 'Win a domestic cup', 'Develop one youth player into the first team', 'Stay profitable in transfers'],
  mid:    ['Finish in the top half', 'Reach the cup quarter-finals', 'Sign two quality players', 'Improve squad overall rating'],
  lower:  ['Avoid relegation', 'Win 10 league matches', 'Reduce club debt', 'Promote one youth academy player'],
};

/* ─── Fixture Generator ─── */

const generateFixtures = (myClub, allClubs) => {
  const leagueClubs = allClubs.filter(c => c.league === myClub.league && c.name !== myClub.name);
  const fixtures = [];
  let week = 1;

  leagueClubs.forEach(opponent => {
    fixtures.push({
      id: `f-${week}-h`, week, competition: myClub.league, competitionType: 'league',
      home: myClub.name, away: opponent.name, homeClub: myClub, awayClub: opponent,
      venue: myClub.stadium || `${myClub.name} Stadium`, played: false, result: null,
    });
    week++;
    fixtures.push({
      id: `f-${week}-a`, week, competition: myClub.league, competitionType: 'league',
      home: opponent.name, away: myClub.name, homeClub: opponent, awayClub: myClub,
      venue: opponent.stadium || `${opponent.name} Stadium`, played: false, result: null,
    });
    week++;
  });

  const cupOpponents = [...leagueClubs].sort(() => Math.random() - 0.5).slice(0, 4);
  cupOpponents.forEach((opponent, i) => {
    fixtures.push({
      id: `cup-${i+1}`, week: week + i * 3, competition: 'Domestic Cup', competitionType: 'cup',
      home: i%2===0 ? myClub.name : opponent.name,
      away: i%2===0 ? opponent.name : myClub.name,
      homeClub: i%2===0 ? myClub : opponent,
      awayClub: i%2===0 ? opponent : myClub,
      venue: i%2===0 ? (myClub.stadium||`${myClub.name} Stadium`) : (opponent.stadium||`${opponent.name} Stadium`),
      played: false, result: null,
    });
  });

  return fixtures.sort((a, b) => a.week - b.week);
};

/* ─── League Table Generator ─── */

const generateLeagueTable = (allClubs, myClubName) =>
  allClubs.map(club => ({
    clubName: club.name, clubColor: club.color, badgeUrl: club.badgeUrl,
    played: 0, won: 0, drawn: 0, lost: 0,
    goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [],
    isUser: club.name === myClubName,
  }));

/* ─── Match Simulator ─── */

const simulateMatch = (homeClub, awayClub, allPlayers) => {
  const getSquadRating = (clubName) => {
    const players = allPlayers.filter(p => p.club === clubName);
    if (!players.length) return 75;
    return Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length);
  };
  const homeRating = getSquadRating(homeClub.name) + randomBetween(0, 8);
  const awayRating = getSquadRating(awayClub.name) + randomBetween(0, 5);
  const totalGoals = randomBetween(0, 5);
  const homeShare  = homeRating / (homeRating + awayRating);
  const homeGoals  = Math.round(totalGoals * homeShare + (Math.random() - 0.5));
  const awayGoals  = Math.max(0, totalGoals - homeGoals);
  return { homeGoals: Math.max(0, homeGoals), awayGoals: Math.max(0, awayGoals) };
};

/* ─── Youth Player Generator ─── */

const generateYouthPlayers = (myClub) => {
  const positions  = ['GK','CB','LB','RB','CM','CDM','CAM','LW','RW','ST'];
  const firstNames = ['Luca','Marco','Diego','Kai','James','Theo','Alex','Sam','Ryan','Oscar'];
  const lastNames  = ['Silva','Müller','García','Smith','Johnson','Brown','Davis','Wilson','Moore','Taylor'];
  return Array.from({ length: 8 }, (_, i) => ({
    id: 9000 + i,
    name: `${firstNames[i%firstNames.length]} ${lastNames[i%lastNames.length]}`,
    club: myClub.name, position: positions[i%positions.length],
    overall: randomBetween(55, 68), potential: randomBetween(72, 88),
    age: randomBetween(16, 19),
    pace: randomBetween(60,82), shooting: randomBetween(50,75), passing: randomBetween(55,78),
    dribbling: randomBetween(58,80), defending: randomBetween(45,72), physical: randomBetween(55,75),
    value: randomBetween(500000, 3000000), wage: randomBetween(1000, 8000),
    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstNames[i%firstNames.length])}+${encodeURIComponent(lastNames[i%lastNames.length])}&background=1e242d&color=fff`,
    isYouth: true,
  }));
};

/* ─── Store ─── */

const useGameStore = create(
  persist(
    (set, get) => ({

      /* ── Core ── */
      myClub: null,
      squad: [],
      starting11: [],
      formation: '4-3-3',
      budget: 0,
      season: 1,
      week: 1,
      results: [],
      allPlayers: playersData.players,
      allClubs: playersData.clubs,
      allLeagues: playersData.leagues,

      /* ── Manager profile (set during onboarding flow) ── */
      managerProfile: null, // { name, dob }

      /* ── Season state ── */
      fixtures: [],
      currentFixtureIndex: 0,
      leagueTable: [],
      notifications: [],
      injuries: [],
      morale: {},
      managerRating: 50,
      objectives: [],
      careerHistory: [],
      awards: [],
      wages: 0,
      revenue: 0,
      youthPlayers: [],

      /* ── Actions ── */

      setManagerProfile: (profile) => set({ managerProfile: profile }),

      chooseClub: (club) => {
        const squadPlayers = playersData.players.filter(p => p.club === club.name);
        const leagueClubs  = playersData.clubs.filter(c => c.league === club.league);
        const fixtures     = generateFixtures(club, leagueClubs);
        const leagueTable  = generateLeagueTable(leagueClubs, club.name);
        const objectives   = TIER_OBJECTIVES[getClubTier(club)] || TIER_OBJECTIVES.mid;
        const youthPlayers = generateYouthPlayers(club);
        const wages        = squadPlayers.reduce((s, p) => s + (p.wage||0), 0);
        const morale       = {};
        squadPlayers.forEach(p => { morale[p.id] = 70; });

        set({
          myClub: club, budget: club.budget, squad: squadPlayers,
          starting11: [], results: [], season: 1, week: 1,
          fixtures, currentFixtureIndex: 0, leagueTable,
          notifications: [{
            id: Date.now(), type: 'board', title: 'Welcome, Gaffer',
            message: 'The board has set their expectations for the season. Check your objectives and make them proud.',
            read: false, week: 1,
          }],
          injuries: [], morale,
          managerRating: 50,
          objectives: objectives.map((text, i) => ({ id: i, text, met: false })),
          youthPlayers, wages, revenue: 0,
        });
      },

      setStarting11: (players) => set({ starting11: players }),
      setFormation:  (formation) => set({ formation }),
      addResult:     (result) => set(state => ({ results: [...state.results, result] })),
      advanceWeek:   () => set(state => ({ week: state.week + 1 })),

      buyPlayer: (player, fee) =>
        set(state => {
          if (state.budget < fee) return state;
          return {
            squad: [...state.squad, player],
            budget: state.budget - fee,
            allPlayers: state.allPlayers.filter(p => p.id !== player.id),
            wages: state.wages + (player.wage||0),
            morale: { ...state.morale, [player.id]: 75 },
          };
        }),

      sellPlayer: (player, fee) =>
        set(state => {
          const { [player.id]: _, ...morale } = state.morale;
          return {
            squad: state.squad.filter(p => p.id !== player.id),
            starting11: state.starting11.filter(p => p.id !== player.id),
            budget: state.budget + fee,
            wages: Math.max(0, state.wages - (player.wage||0)),
            morale,
          };
        }),

      playFixture: (fixtureId) => {
        const state   = get();
        const fixture = state.fixtures.find(f => f.id === fixtureId);
        if (!fixture || fixture.played) return;

        const isHome   = fixture.home === state.myClub.name;
        const homeClub = isHome ? state.myClub : fixture.awayClub;
        const awayClub = isHome ? fixture.awayClub : state.myClub;
        const { homeGoals, awayGoals } = simulateMatch(homeClub, awayClub, state.allPlayers);

        const myGoals  = isHome ? homeGoals : awayGoals;
        const oppGoals = isHome ? awayGoals : homeGoals;
        const outcome  = myGoals > oppGoals ? 'W' : myGoals < oppGoals ? 'L' : 'D';

        const fixtures = state.fixtures.map(f =>
          f.id === fixtureId ? { ...f, played: true, result: { homeGoals, awayGoals } } : f
        );

        let leagueTable = [...state.leagueTable];
        if (fixture.competitionType === 'league') {
          leagueTable = leagueTable.map(row => {
            const isHome2 = row.clubName === fixture.home;
            const isAway2 = row.clubName === fixture.away;
            if (!isHome2 && !isAway2) return row;
            const gf  = isHome2 ? homeGoals : awayGoals;
            const ga  = isHome2 ? awayGoals : homeGoals;
            const won = gf > ga;
            const drw = gf === ga;
            return {
              ...row,
              played: row.played + 1,
              won:    row.won   + (won ? 1 : 0),
              drawn:  row.drawn + (drw ? 1 : 0),
              lost:   row.lost  + (!won && !drw ? 1 : 0),
              goalsFor:      row.goalsFor + gf,
              goalsAgainst:  row.goalsAgainst + ga,
              goalDifference: row.goalDifference + gf - ga,
              points: row.points + (won ? 3 : drw ? 1 : 0),
              form: [...row.form.slice(-4), won ? 'W' : drw ? 'D' : 'L'],
            };
          }).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
        }

        const ratingDelta  = outcome === 'W' ? 2 : outcome === 'L' ? -2 : 0;
        const managerRating = Math.min(100, Math.max(0, state.managerRating + ratingDelta));

        set({
          fixtures,
          leagueTable,
          results: [...state.results, { fixtureId, week: state.week, competition: fixture.competition, home: fixture.home, away: fixture.away, homeGoals, awayGoals, outcome }],
          currentFixtureIndex: state.currentFixtureIndex + 1,
          week: state.week + 1,
          managerRating,
        });
      },

      simRemaining: () => {
        const state = get();
        state.fixtures.filter(f => !f.played).forEach(f => get().playFixture(f.id));
      },

      addNotification: (notification) =>
        set(state => ({ notifications: [{ id: Date.now(), read: false, week: state.week, ...notification }, ...state.notifications] })),

      markNotificationRead: (id) =>
        set(state => ({ notifications: state.notifications.map(n => n.id===id ? {...n,read:true} : n) })),

      clearNotifications: () => set({ notifications: [] }),

      addInjury: (playerId, recoveryWeeks) =>
        set(state => ({ injuries: [...state.injuries, { playerId, recoveryWeeks, weekInjured: state.week }] })),

      removeInjury: (playerId) =>
        set(state => ({ injuries: state.injuries.filter(i => i.playerId !== playerId) })),

      setPlayerMorale: (playerId, value) =>
        set(state => ({ morale: { ...state.morale, [playerId]: Math.min(100, Math.max(0, value)) } })),

      markObjectiveMet: (id) =>
        set(state => ({ objectives: state.objectives.map(o => o.id===id ? {...o,met:true} : o) })),

      addAward: (award) =>
        set(state => ({ awards: [...state.awards, { ...award, season: state.season, week: state.week }] })),

      recordSeasonEnd: () => {
        const state   = get();
        const myRow   = state.leagueTable.find(r => r.isUser);
        const position = myRow ? state.leagueTable.indexOf(myRow) + 1 : '—';
        set(state => ({
          careerHistory: [...state.careerHistory, {
            club: state.myClub?.name, season: state.season, position,
            wins: myRow?.won || 0,
            trophies: state.awards.filter(a => a.season === state.season).length,
          }],
          season: state.season + 1,
          week: 1,
          currentFixtureIndex: 0,
        }));
      },

      promoteYouthPlayer: (playerId) =>
        set(state => {
          const player = state.youthPlayers.find(p => p.id === playerId);
          if (!player) return state;
          return {
            squad: [...state.squad, { ...player, isYouth: false }],
            youthPlayers: state.youthPlayers.filter(p => p.id !== playerId),
            morale: { ...state.morale, [player.id]: 80 },
            wages: state.wages + (player.wage||0),
          };
        }),

      addRevenue: (amount) =>
        set(state => ({ revenue: state.revenue + amount, budget: state.budget + amount })),

      resetGame: () =>
        set({
          myClub: null, squad: [], starting11: [], formation: '4-3-3',
          budget: 0, season: 1, week: 1, results: [],
          allPlayers: playersData.players,
          managerProfile: null,
          fixtures: [], currentFixtureIndex: 0, leagueTable: [],
          notifications: [], injuries: [], morale: {},
          managerRating: 50, objectives: [], careerHistory: [], awards: [],
          wages: 0, revenue: 0, youthPlayers: [],
        }),
    }),

    {
      name: 'the-gaffer-save',
      partialize: (state) => ({
        myClub:              state.myClub,
        squad:               state.squad,
        starting11:          state.starting11,
        formation:           state.formation,
        budget:              state.budget,
        season:              state.season,
        week:                state.week,
        results:             state.results,
        managerProfile:      state.managerProfile,
        fixtures:            state.fixtures,
        currentFixtureIndex: state.currentFixtureIndex,
        leagueTable:         state.leagueTable,
        notifications:       state.notifications,
        injuries:            state.injuries,
        morale:              state.morale,
        managerRating:       state.managerRating,
        objectives:          state.objectives,
        careerHistory:       state.careerHistory,
        awards:              state.awards,
        wages:               state.wages,
        revenue:             state.revenue,
        youthPlayers:        state.youthPlayers,
      }),
    }
  )
);

export default useGameStore;