const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'players.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const CLUB_EXTRA = {
  'Manchester City': {
    founded: 1880,
    history: 'Founded as St. Mark\'s (West Gorton), City transformed into a global powerhouse under Sheikh Mansour\'s 2008 takeover. Multiple Premier League titles and the 2023 Champions League crown cement their elite status.',
    expectations: ['Win the Premier League', 'Reach the Champions League semi-finals', 'Play attractive, dominant football'],
    kitHome: '#6CABDD',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  },
  'Liverpool': {
    founded: 1892,
    history: 'One of England\'s most storied clubs with 19 league titles and 6 European Cups. The Reds are synonymous with passionate support, Anfield\'s electric atmosphere, and historic European nights.',
    expectations: ['Challenge for the Premier League title', 'Progress deep in Europe', 'High-press, high-intensity football'],
    kitHome: '#C8102E',
    kitAway: '#000000',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  },
  'Arsenal': {
    founded: 1886,
    history: 'The Gunners\' unbeaten 2003-04 Invincibles season remains the gold standard of English football. A club built on flair and technique, Arsenal are enjoying a resurgent era under Arteta.',
    expectations: ['Win the Premier League', 'Reach the Champions League knockouts', 'Develop homegrown talent'],
    kitHome: '#EF0107',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  },
  'Manchester United': {
    founded: 1878,
    history: 'The most successful club of the Premier League era, United\'s 27-year Ferguson dynasty yielded 13 league titles. A global institution rebuilding toward former glories.',
    expectations: ['Return to top-four football', 'Win a major domestic trophy', 'Restore the United identity'],
    kitHome: '#DA291C',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  },
  'Chelsea': {
    founded: 1905,
    history: 'Roman Abramovich\'s 2003 takeover sparked an era of dominance. Two Champions League titles and five Premier League crowns define the Blues\' modern identity.',
    expectations: ['Champions League qualification', 'Compete on all fronts', 'Build a cohesive long-term squad'],
    kitHome: '#034694',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  },
  'Tottenham': {
    founded: 1882,
    history: 'Famous for attacking football and a loyal fanbase, Spurs reached their first Champions League final in 2019. Always on the cusp of a major breakthrough.',
    expectations: ['Secure top-four finish', 'Make a deep cup run', 'Play exciting attacking football'],
    kitHome: '#132257',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  },
  'Brighton': {
    founded: 1901,
    history: 'Brighton have risen from near-oblivion to Premier League regulars, earning a reputation as one of Europe\'s most progressive clubs tactically under Graham Potter and Roberto De Zerbi.',
    expectations: ['Maintain Premier League status', 'Develop and sell young talent', 'Play progressive possession football'],
    kitHome: '#0057B8',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
  },
  'Aston Villa': {
    founded: 1874,
    history: 'One of England\'s founding clubs and European Cup winners in 1982, Villa have undergone a remarkable revival under Unai Emery, returning to Champions League football.',
    expectations: ['Champions League football', 'Top-six finish', 'Build on European ambitions'],
    kitHome: '#670E36',
    kitAway: '#87CEEB',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg',
  },
  'Real Madrid': {
    founded: 1902,
    history: 'The most decorated club in football history with 15 Champions League titles. Los Blancos define European royalty and have produced some of the game\'s greatest ever players.',
    expectations: ['Win La Liga', 'Compete for the Champions League', 'Maintain global prestige'],
    kitHome: '#FFFFFF',
    kitAway: '#000080',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  },
  'Barcelona': {
    founded: 1899,
    history: 'Més que un club — more than a club. Barcelona\'s tiki-taka era under Guardiola redefined modern football. Five Champions League titles and a philosophy built on La Masia youth development.',
    expectations: ['Win La Liga', 'Restore Champions League glory', 'Play beautiful, possession-based football'],
    kitHome: '#A50044',
    kitAway: '#FFD700',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  },
  'Atletico Madrid': {
    founded: 1903,
    history: 'The working-class alternative to Real Madrid, Atleti have punched above their weight for decades. Two Champions League finals and two La Liga titles under Diego Simeone define their gritty era.',
    expectations: ['Top-three La Liga finish', 'Reach Champions League quarters', 'Disciplined defensive football'],
    kitHome: '#CB3524',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_de_madrid_crest.svg',
  },
  'Bayern Munich': {
    founded: 1900,
    history: 'Germany\'s dominant force with 32 Bundesliga titles and 6 European Cups. The Rekordmeister set the standard for German football and produced legends like Beckenbauer, Müller, and Lahm.',
    expectations: ['Win the Bundesliga', 'Reach the Champions League semis', 'Attractive attacking football'],
    kitHome: '#DC052D',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg',
  },
  'Bayer Leverkusen': {
    founded: 1904,
    history: 'Long known as "Neverkusen" for near misses, Leverkusen shattered that reputation by winning their first-ever Bundesliga title in 2023-24 with an unbeaten season under Xabi Alonso.',
    expectations: ['Defend Bundesliga title', 'Progress in Europe', 'Attractive pressing football'],
    kitHome: '#E32221',
    kitAway: '#000000',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  },
  'AC Milan': {
    founded: 1899,
    history: 'One of the world\'s most iconic clubs with 7 European Cups. The Rossoneri\'s late 1980s and early 1990s sides under Sacchi and Capello are considered among the greatest ever assembled.',
    expectations: ['Serie A title challenge', 'Reach Champions League knockouts', 'Restore European pedigree'],
    kitHome: '#FB090B',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  },
  'Inter Milan': {
    founded: 1908,
    history: 'The only Italian club to have always played in Serie A, Inter won the treble in 2010 under Mourinho. A recent resurgence has seen them reclaim their status as Italy\'s top club.',
    expectations: ['Win Serie A', 'Compete in Champions League', 'Strong defensive organisation'],
    kitHome: '#0068A8',
    kitAway: '#000000',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  },
  'PSG': {
    founded: 1970,
    history: 'QSI\'s 2011 takeover transformed PSG into a superclub. Despite domestic dominance, the Champions League has remained elusive. A new project focused on youth and collective football is underway.',
    expectations: ['Win Ligue 1', 'Reach Champions League final', 'Build team spirit over star power'],
    kitHome: '#003370',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  },
  'Galatasaray': {
    founded: 1905,
    history: 'Turkey\'s most successful club and the only Turkish side to win a UEFA trophy — the 2000 UEFA Cup. Galatasaray are a fierce rival in the Super Lig with a passionate fanbase.',
    expectations: ['Win the Super Lig', 'Compete in European group stages', 'Entertain the passionate fanbase'],
    kitHome: '#F6A623',
    kitAway: '#CC0000',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Galatasaray_Sports_Club_Logo.png',
  },
  'Besiktas': {
    founded: 1903,
    history: 'One of Turkey\'s "Big Three", Besiktas are the only Turkish club to have an unbeaten home record in European competition. Known for their fierce atmosphere at Vodafone Park.',
    expectations: ['Challenge for Super Lig title', 'Reach European knockouts', 'Play fast, direct football'],
    kitHome: '#000000',
    kitAway: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Besiktas_JK_logo.svg',
  },
};

data.clubs = data.clubs.map(club => {
  const extra = CLUB_EXTRA[club.name];
  if (!extra) return club;
  return { ...club, ...extra };
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('✅ players.json clubs patched with extra fields.');
