import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import playersData from '../data/players.json';

const useGameStore = create(
  persist(
    (set, get) => ({
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

      chooseClub: (club) => {
        const squadPlayers = playersData.players.filter(p => p.club === club.name);
        set({
          myClub: club,
          budget: club.budget,
          squad: squadPlayers,
          starting11: [],
          results: [],
          season: 1,
          week: 1,
        });
      },

      setStarting11: (players) => set({ starting11: players }),
      setFormation: (formation) => set({ formation }),
      addResult: (result) => set(state => ({ results: [...state.results, result] })),
      advanceWeek: () => set(state => ({ week: state.week + 1 })),

      buyPlayer: (player, fee) =>
        set(state => {
          if (state.budget < fee) return state;
          return {
            squad: [...state.squad, player],
            budget: state.budget - fee,
            allPlayers: state.allPlayers.filter(p => p.id !== player.id),
          };
        }),

      sellPlayer: (player, fee) =>
        set(state => ({
          squad: state.squad.filter(p => p.id !== player.id),
          starting11: state.starting11.filter(p => p.id !== player.id),
          budget: state.budget + fee,
        })),

      resetGame: () =>
        set({
          myClub: null,
          squad: [],
          starting11: [],
          formation: '4-3-3',
          budget: 0,
          season: 1,
          week: 1,
          results: [],
          allPlayers: playersData.players,
        }),
    }),
    {
      name: 'the-gaffer-save',
      partialize: (state) => ({
        myClub: state.myClub,
        squad: state.squad,
        starting11: state.starting11,
        formation: state.formation,
        budget: state.budget,
        season: state.season,
        week: state.week,
        results: state.results,
      }),
    }
  )
);

export default useGameStore;