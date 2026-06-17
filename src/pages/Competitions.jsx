import { useState, useMemo, useEffect } from 'react';
import useGameStore from '../store/gameStore';

/* ─────────────────────────────────────────
   COMPETITION DATA  (prose history, no color field)
───────────────────────────────────────── */
const COMPETITIONS = {
  'Premier League': {
    id: 'pl', name: 'Premier League', shortName: 'PL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
    accent: '#a855f7', type: 'league', country: 'England', founded: 1992, teams: 20, prize: '£160M+',
    prose: `In 1992, twenty-two First Division clubs broke away from the Football League and created something the world had never quite seen — a football competition built as much for television as for the terraces. The Premier League was born with a landmark £304 million BSkyB deal, and English football was never the same again.\n\nThe early years belonged to Manchester United and Sir Alex Ferguson. Between 1993 and 1999, United won five titles, with Eric Cantona as their snarling, genius talisman. Then Roman Abramovich arrived at Chelsea in 2003 and José Mourinho in 2004, and suddenly the map shifted. The Special One delivered back-to-back titles, and the era of the billionaire owner had begun in earnest.\n\nManchester City's Agueroooo moment in 2012 — a 93rd-minute winner on the final day to snatch the title from United — became the single most dramatic moment in the competition's history. Then came Leicester in 2016: a club given 5,000/1 odds, with Jamie Vardy, Riyad Mahrez and N'Golo Kanté playing football that made no sense on paper. They won it. The whole world stopped.\n\nToday the Premier League is broadcast in over 180 countries. Pep Guardiola's Manchester City redefined domestic dominance — six titles in seven seasons, a historic 100-point campaign, and an unprecedented Treble in 2022/23. But every season the league delivers something new. No other competition on earth combines this level of quality, drama, and genuine unpredictability.`,
  },
  'FA Cup': {
    id: 'facup', name: 'FA Cup', shortName: 'FA Cup',
    logo: 'https://upload.wikimedia.org/wikipedia/en/6/6d/FA_Cup_logo.svg',
    accent: '#e63946', type: 'cup', country: 'England', founded: 1871, teams: 700, prize: '£2.25M',
    rounds: ['R1','R2','R3','R4','R5','QF','SF','F'],
    prose: `The FA Cup is the oldest football competition in the world. When fifteen clubs gathered in 1871 to contest the first edition, they had no idea they were building something that would still be thrilling more than 150 years later. Wanderers FC won that first final at the Kennington Oval. The template for every knockout cup competition on earth was set in that moment.\n\nIts history is written in giant-killings and Wembley miracles. In 1923, the first final at Wembley drew 300,000 people — a police officer on a white horse named Billy famously cleared the pitch so the game could begin. In 1973, Second Division Sunderland beat mighty Leeds United 1-0 with Ian Porterfield's goal and Jim Montgomery's legendary double-save. In 1988, Wimbledon's Crazy Gang — in the Football League for just eleven years — beat Liverpool via Lawrie Sanchez's header and Dave Beasant's penalty save.\n\nOver 700 clubs enter every season, from Premier League giants to amateur sides playing on park pitches. That scale, that democracy, makes it unique in world football. Every January, a non-league club draws a top-flight side and the nation holds its breath. Sometimes the impossible happens. The FA Cup exists to remind us that in football, it always can.`,
  },
  'Carabao Cup': {
    id: 'carabao', name: 'Carabao Cup', shortName: 'EFL Cup',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/5c/EFL_Cup.svg',
    accent: '#4ade80', type: 'cup', country: 'England', founded: 1960, teams: 92, prize: '£100K',
    rounds: ['R1','R2','R3','QF','SF','F'],
    prose: `The League Cup — now known as the Carabao Cup after a Thai energy drink company took naming rights in 2017 — was introduced in 1960 to generate extra revenue for lower-league clubs. The early editions were treated with scepticism by the top clubs, some of whom refused to enter at all. It took a Wembley final and the genuine excitement that came with it to give the competition the legitimacy it had been searching for.\n\nLiverpool embraced it first and hardest, winning four consecutive League Cups between 1981 and 1984 in one of the most dominant stretches any club has managed in any competition. That era cemented the trophy as genuine silverware, not an afterthought.\n\nIn the modern era, Manchester City under Pep Guardiola turned it into something approaching a personal trophy, winning it seven times in eight seasons. But the competition delivers its own moments of shock and joy: Newcastle United's 2023 victory ended 70 years of waiting for silverware, and the reaction from that fanbase reminded everyone why these trophies matter — not for the clubs at the top, but for the people who've waited their whole lives for a day like that.`,
  },
  'Champions League': {
    id: 'ucl', name: 'Champions League', shortName: 'UCL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
    accent: '#7c6ff7', type: 'european', country: 'Europe', founded: 1955, teams: 36, prize: '£100M+',
    hasGroups: true, rounds: ['League Phase','R16','QF','SF','F'],
    prose: `When UEFA launched the European Cup in 1955, it was a simple idea: let the champions of each nation compete against each other. What grew from that idea became the most watched annual sporting event on the planet. Real Madrid won the first five editions, with Alfredo Di Stéfano and Ferenc Puskás producing football of such elegance that the rest of Europe could only watch and marvel.\n\nThe competition became the UEFA Champions League in 1992 — rebranded, reformatted, given a group stage, an unmistakable anthem, and a commercial machine that turned it into something beyond sport. The finest players in the world no longer just dreamed of winning their league. They dreamed of lifting that trophy under the lights in May.\n\nIts history is full of nights that stopped time. Liverpool coming back from 3-0 down at half-time against AC Milan in Istanbul in 2005 is the greatest sporting comeback ever witnessed. Chelsea winning in Bayern Munich's own stadium on penalties in 2012 is the kind of story no screenwriter would dare invent. Real Madrid's three consecutive titles under Zinedine Zidane from 2016 to 2018 stands as the most complete period of dominance in the competition's modern era. This is the highest stage in club football. Everything else is preparation for it.`,
  },
  'Europa League': {
    id: 'uel', name: 'Europa League', shortName: 'UEL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/93/UEFA_Europa_League_logo.svg',
    accent: '#f59e0b', type: 'european', country: 'Europe', founded: 1971, teams: 36, prize: '£18M+',
    rounds: ['League Phase','R32','R16','QF','SF','F'],
    prose: `The Europa League began life as the UEFA Cup in 1971, a two-legged format that rewarded tactical discipline and squad depth. Tottenham Hotspur won the first edition, and for years the competition served as European football's second tier — prestigious but not quite the dream. The full rebrand to Europa League in 2009 brought in a group stage, a direct pathway from the Champions League, and an identity that gave it genuine weight.\n\nNo club has owned the Europa League like Sevilla. They have won it seven times, including an extraordinary run of three consecutive titles from 2014 to 2016 that no team in any major UEFA competition has matched. Their ability to peak in this specific tournament — in the spring knockouts, on neutral grounds, under pressure — became something almost supernatural.\n\nChelsea's 4-1 destruction of Arsenal in Baku in 2019, with Eden Hazard scoring twice in his final act as a Chelsea player, is the kind of memory this competition creates and keeps. For supporters who have never experienced a European final, the Europa League represents something visceral and real.`,
  },
  'Conference League': {
    id: 'uecl', name: 'Conference League', shortName: 'UECL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/27/UEFA_Europa_Conference_League_logo.svg',
    accent: '#2dd4bf', type: 'european', country: 'Europe', founded: 2021, teams: 36, prize: '£4M+',
    rounds: ['League Phase','R16','QF','SF','F'],
    prose: `UEFA launched the Conference League in 2021 to address a gap that had existed for decades: clubs from smaller European nations routinely fell out of continental competition in qualifying, never making it to the main draw. The Conference League gave them a guaranteed stage. It was a democratic idea, and it worked immediately.\n\nRoma under José Mourinho won the inaugural edition in 2022, defeating Feyenoord 1-0 in Tirana for the club's first European trophy in their 93-year history. The scenes in Rome that night captured everything the competition was built for. A year later, West Ham beat Fiorentina in Prague to end 58 years without a European trophy, with Declan Rice lifting the cup in what turned out to be his last act as a West Ham player.\n\nThe Conference League is young, but it already has stories worth telling. It has proved that the third tier of European football is not a consolation prize — it is a real competition, with real stakes, producing real nights that supporters carry with them forever.`,
  },
  'Supercopa de España': {
    id: 'supercopa', name: 'Supercopa de España', shortName: 'Supercopa',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Supercopa_de_Espa%C3%B1a_logo.svg/200px-Supercopa_de_Espa%C3%B1a_logo.svg.png',
    accent: '#eab308', type: 'super', country: 'Spain', founded: 1982, teams: 4, prize: '£3M',
    rounds: ['SF','F'],
    prose: `The Supercopa de España began in 1982 as a two-legged contest between the La Liga champions and the Copa del Rey winners — a season curtain-raiser that gave Spanish football an early taste of competitive action. For years it was a modest affair, played in August, more training exercise than genuine contest.\n\nThat changed dramatically in 2020, when the competition was expanded to four clubs, reformatted into a mini-tournament, and relocated to Saudi Arabia in a deal worth hundreds of millions of euros. Suddenly the Supercopa had money, infrastructure, and an audience. Real Madrid, Barcelona, Atletico Madrid and Sevilla now compete for a trophy that carries real prestige and genuine financial stakes.\n\nIn the modern era, Real Madrid have treated the Supercopa as routine. Carlo Ancelotti's squad has collected it with the same cold efficiency they apply to everything else. But for the fans travelling to Riyadh — watching the Clásico under the Saudi sky — it remains something genuinely theatrical.`,
  },
  'UEFA Super Cup': {
    id: 'uefasupercup', name: 'UEFA Super Cup', shortName: 'Super Cup',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/06/UEFA_Super_Cup_logo.svg/200px-UEFA_Super_Cup_logo.svg.png',
    accent: '#38bdf8', type: 'super', country: 'Europe', founded: 1972, teams: 2, prize: '£3.5M',
    rounds: ['F'],
    prose: `The UEFA Super Cup was born informally in 1972 as a contest between the winners of the European Cup and the Cup Winners' Cup. Ajax played Rangers in that first edition. The competition formalised in 1998, becoming a single match at a neutral venue each August — pitting the Champions League winner against the Europa League winner.\n\nThe match typically happens in a warm-weather city in southern Europe, giving it a different atmosphere to the tension of a May final: high-quality football played between sides still sharp from their respective campaigns. For clubs and supporters, it is a chance to measure European excellence directly before the new season begins.\n\nLiverpool's 2019 Super Cup against Chelsea in Istanbul — the same city as their iconic 2005 Champions League triumph — produced one of the competition's most memorable nights. Adrián, a backup goalkeeper who had signed just days earlier, saved the decisive penalty in the shootout. It was exactly the kind of surreal, outsized moment that defines the Super Cup.`,
  },
  'FIFA Club World Cup': {
    id: 'cwc', name: 'FIFA Club World Cup', shortName: 'Club WC',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/57/FIFA_Club_World_Cup_logo.svg/200px-FIFA_Club_World_Cup_logo.svg.png',
    accent: '#38bdf8', type: 'world', country: 'Global', founded: 2000, teams: 32, prize: '£50M+',
    rounds: ['Groups','R16','QF','SF','F'],
    prose: `The FIFA Club World Cup was conceived to answer a question football had never formally settled: which club in the world is the best? The inaugural tournament was held in Brazil in 2000 with just eight clubs. For years the competition remained modest — a December sideshow held in Japan under Toyota sponsorship, producing memorable moments like Corinthians defeating Chelsea in 2012, Paulo Guerrero's header ending the European champions' hopes with a simplicity that was almost brutal.\n\nThe competition was reborn in 2025. FIFA expanded it to 32 clubs, moved the tournament to the United States, and transformed it into something that now resembles a World Cup for clubs — a month-long event with group stages, knockouts, and a final that carries genuine global significance. The prize money reached levels that made the expanded format impossible to dismiss.\n\nFor a club that wins it, there is now a legitimate claim to be the best team on the planet. Not just in Europe, not just in their confederation — in the world. That is what this competition was always trying to be. In its expanded form, it finally is.`,
  },
  'FIFA Intercontinental Cup': {
    id: 'intercontinental', name: 'FIFA Intercontinental Cup', shortName: 'Intercont.',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/FIFA_Intercontinental_Cup_logo.svg/200px-FIFA_Intercontinental_Cup_logo.svg.png',
    accent: '#d97706', type: 'world', country: 'Global', founded: 1960, teams: 6, prize: '£10M+',
    rounds: ['QF','SF','F'],
    prose: `Before the Club World Cup existed, there was the Intercontinental Cup — and for four decades it was the closest thing football had to a world championship. Born in 1960 as a showdown between the European Cup winner and the Copa Libertadores champion, the competition was raw, sometimes violent, and utterly gripping. Two footballing continents with different philosophies meeting once a year to prove who was better.\n\nThe Toyota Cup years — when sponsorship moved the final to Tokyo through most of the 1980s and 90s — gave the competition a singular atmosphere. Maradona's Boca Juniors, Pelé's Santos, and Zidane's Real Madrid all walked out under those lights. The match was an event of genuine cultural weight in Japan, broadcast to hundreds of millions across Asia.\n\nFIFA relaunched the competition in 2024, expanding it to six clubs and staging the final in Qatar. Real Madrid won the inaugural edition, beating Pachuca 3-0 with the cold efficiency that has become their trademark. The trophy joined an already staggering collection at the Bernabéu. But the Intercontinental Cup has always been about more than the winners — it is about what happens when the world's footballing cultures collide.`,
  },
  'La Liga': {
    id: 'laliga', name: 'La Liga', shortName: 'La Liga',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/13/LaLiga.svg',
    accent: '#ef4444', type: 'league', country: 'Spain', founded: 1929, teams: 20, prize: '£150M+',
    prose: `La Liga was founded in 1929, with Barcelona winning the first championship. From the very beginning, the competition was shaped by geography and identity. Spain was a country of regions with fierce loyalties, and those loyalties found their fiercest expression in the Clásico — the rivalry between Real Madrid and Barcelona that would define Spanish football for the next century.\n\nReal Madrid's dominance of the 1950s and 60s remains the most extraordinary sustained run of success in the sport's history. With Alfredo Di Stéfano, Ferenc Puskás and Gento, they won five consecutive European Cups and set a standard the rest of Europe could only aspire to. Then came Johan Cruyff's Barcelona, then the tika-taka revolution of Pep Guardiola's side between 2008 and 2012, playing football so precise it genuinely changed how the game was understood globally.\n\nBetween 2004 and 2021, La Liga hosted the greatest individual rivalry in football history — Lionel Messi versus Cristiano Ronaldo. Ten Ballon d'Or awards between them in that period. Records broken season after season. Now a new generation has arrived — Vinicius Jr, Pedri, Gavi, Bellingham — and the league evolves again. La Liga has always known how to renew itself, and it has always known how to produce the finest football on the planet.`,
  },
  'Copa del Rey': {
    id: 'copadelrey', name: 'Copa del Rey', shortName: 'Copa del Rey',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/58/Copa_del_Rey_logo.svg',
    accent: '#ca8a04', type: 'cup', country: 'Spain', founded: 1903, teams: 83, prize: '£1.8M',
    rounds: ['R32','R16','QF','SF','F'],
    prose: `The Copa del Rey is the oldest football competition in Spain, predating La Liga by 26 years. Born in 1902 — technically the Copa de la Coronación — and formally named in the reign of Alfonso XIII, it has been contested almost every year since, surviving civil war, dictatorship, and the transformation of Spanish football into a global commercial empire.\n\nAthletic Club Bilbao hold a unique place in the Copa del Rey's identity. With 23 wins and a policy of only fielding players from the Basque Country, they represent something this competition has always stood for: that identity, culture and footballing philosophy can coexist with excellence. Barcelona's 31 wins make them the all-time record holders, but it is Athletic's model — local, principled, stubborn — that gives the Copa del Rey its romantic dimension.\n\nThe competition's greatest modern moment came in 2021, when Sevilla and Real Betis met in a Copa del Rey final for the first time in history. La Cartuja stadium was a cauldron of divided loyalties, the game went to penalties, and Betis won their first Copa del Rey in 25 years. It was precisely the kind of final this competition exists to produce.`,
  },
  'Bundesliga': {
    id: 'bundesliga', name: 'Bundesliga', shortName: 'Bundesliga',
    logo: 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
    accent: '#ef4444', type: 'league', country: 'Germany', founded: 1963, teams: 18, prize: '£95M+',
    prose: `The Bundesliga was founded in 1963 to replace the network of regional German leagues with a single national competition. Borussia Dortmund won the first edition. But the competition was shaped from the outset by a principle that sets it apart from every other major league in the world: the 50+1 rule, which requires clubs to maintain majority supporter ownership. German fans own their clubs. That is not a metaphor — it is the law.\n\nBayern Munich built their first great era in the 1970s, winning three consecutive European Cups and four Bundesliga titles in five years with Beckenbauer, Müller and Maier. The club would go on to define the Bundesliga's identity — dominant, professional, relentless — while Borussia Dortmund under Jürgen Klopp provided the competition with a genuine rival in the early 2010s.\n\nBayern's run of eleven consecutive titles between 2013 and 2023 was historic — no club in Europe's top five leagues has matched it. Then Bayer Leverkusen under Xabi Alonso went the entire 2023/24 season unbeaten, 34 matches without defeat, to end Bayern's dominance in one of the most complete single-season performances in European football history.`,
  },
  'DFB-Pokal': {
    id: 'dfbpokal', name: 'DFB-Pokal', shortName: 'DFB-Pokal',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/DFB-Pokal_Logo.svg',
    accent: '#e5e7eb', type: 'cup', country: 'Germany', founded: 1935, teams: 64, prize: '£500K',
    rounds: ['R1','R2','R3','QF','SF','F'],
    prose: `The DFB-Pokal was founded in 1935, suspended during the Second World War, and resumed in 1952. It is Germany's national cup competition — 64 clubs from across all levels of German football, from the Bundesliga to the fourth tier, drawn together in a single-elimination format that ends with a final at the Olympiastadion in Berlin.\n\nThe early rounds produce the moments the competition is remembered for between finals. Lower-league clubs routinely draw Bundesliga giants and occasionally — memorably — beat them. Eintracht Frankfurt, Werder Bremen, and smaller clubs have all produced moments that stopped Germany in its tracks and reminded the country what cup football is for.\n\nThe 2012 final between Borussia Dortmund and Bayern Munich — with Dortmund winning 5-2 — was one of the great cup final performances in European history, coming just weeks before the two clubs met again in the Champions League final in Munich. That Dortmund side under Jürgen Klopp, with Lewandowski, Götze and Reus, was one of the finest in German football's modern era.`,
  },
  'Serie A': {
    id: 'seriea', name: 'Serie A', shortName: 'Serie A',
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg',
    accent: '#1d4ed8', type: 'league', country: 'Italy', founded: 1929, teams: 20, prize: '£130M+',
    prose: `Serie A was founded in 1929 as Italy unified its regional football leagues into a single national competition. The early decades were dominated by northern industrial clubs — Juventus, Inter Milan, AC Milan — reflecting a geography where football was shaped by the industrial north's wealth and ambition.\n\nBetween 1985 and 1995, Serie A was unambiguously the finest football league in the world. Maradona at Napoli, Van Basten and Gullit at Milan, Ronaldo at Inter, Zidane at Juventus — the best players on earth played in Italy because Italy had the money, the culture and the tactical sophistication to attract them. AC Milan's back-to-back European Cups in 1989 and 1990 with Arrigo Sacchi's pressing revolution represented football thinking that was decades ahead of its time.\n\nJuventus's nine consecutive Serie A titles from 2012 to 2020 was a domestic run without parallel in the league's history — broken eventually by Inter Milan under Antonio Conte in a season that felt like the whole of Italian football exhaling. Inter's 2023/24 Scudetto, won by the widest margin in years with Lautaro Martínez in irresistible form, announced that the league had fully revived.`,
  },
  'Coppa Italia': {
    id: 'coppaitalia', name: 'Coppa Italia', shortName: 'Coppa Italia',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/ac/Coppa_Italia_logo.svg',
    accent: '#16a34a', type: 'cup', country: 'Italy', founded: 1922, teams: 40, prize: '£1.2M',
    rounds: ['R32','R16','QF','SF1','SF2','F'],
    prose: `The Coppa Italia is Italy's oldest football competition, first contested in 1922 — seven years before Serie A was established. Juventus have won it a record 15 times, making the trophy nearly as synonymous with the Turin club as the league title. But the Coppa Italia has always had its own identity, its own capacity for drama that the league cannot replicate.\n\nThe format is unique: the semi-finals are played over two legs, stretching tension across weeks rather than resolving it in one night. A club can lose the first leg heavily and come back. That format rewards resilience and squad depth in a way that single-match knockouts do not, and Italian clubs — built for tactical pragmatism and the long view — thrive in it.\n\nThe Coppa Italia final at the Stadio Olimpico in Rome is one of Italian football's great occasions. When AC Milan and Inter met there in 2016 in a full Milan derby final, the stadium divided itself in two and produced the kind of atmosphere that exists nowhere else in the sport. For clubs outside Juventus — Roma, Lazio, Napoli, Fiorentina — the Coppa Italia represents the most realistic path to silverware.`,
  },
  'Ligue 1': {
    id: 'ligue1', name: 'Ligue 1', shortName: 'Ligue 1',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Ligue1_logo_2024-25.svg',
    accent: '#2563eb', type: 'league', country: 'France', founded: 1932, teams: 18, prize: '£90M+',
    prose: `French professional football began in 1932, and the league went through several rebrands before becoming Ligue 1 in 2002. The competition's early decades produced genuine variety. Then came Olympique Lyonnais and the most remarkable domestic dynasty the league has ever seen — seven consecutive titles from 2002 to 2008, building a scouting and development model that produced players for the world's biggest clubs while continuing to win domestically with remarkable consistency.\n\nThen Qatar came to Paris. QSI's takeover of PSG in 2011 transformed Ligue 1 from a competitive league into a one-club procession. PSG spent over €1.5 billion on transfers in the following decade, winning nine of the next twelve titles. Neymar arrived for a world-record fee. Mbappé arrived from Monaco as a teenager.\n\nBut in 2021, LOSC Lille — with Burak Yilmaz firing at 35 and Christophe Galtier deploying a tactical system built on collective purpose — won the title on the final day. It was a reminder that money does not always win. That Ligue 1 is still a football league, not a coronation.`,
  },
  'Coupe de France': {
    id: 'coupefrance', name: 'Coupe de France', shortName: 'Coupe',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/f/fa/Logo_Coupe_de_France.svg',
    accent: '#1e40af', type: 'cup', country: 'France', founded: 1917, teams: 9000, prize: '£150K',
    rounds: ['R1','R2','R3','R4','R5','R6','R7','QF','SF','F'],
    prose: `The Coupe de France is not like other cup competitions. It is the most inclusive football competition on earth: over 9,000 clubs from every level of French football enter each season, from PSG to amateur sides playing on weekday evenings in the shadow of provincial town halls. From the first round in August to the final at the Stade de France in late spring, it is a portrait of French football in its entirety.\n\nEvery round, professional clubs can face amateur opponents. Every round, the amateur clubs have a theoretical chance to survive. US Quevilly, an amateur club from Normandy, reached the 2012 final by defeating three professional clubs along the way, before losing to Lyon. Their journey captured a nation and remains the most extraordinary giant-killing run in the competition's history.\n\nPSG have dominated the modern era, winning it fifteen times since 2010. But the Coupe de France has never really been about PSG. It has always been about the amateur goalkeeper making impossible saves to keep a Ligue 1 side at bay. About the small-town striker who scores the goal of his life in a half-empty municipal stadium on a Tuesday night.`,
  },
  'Championship': {
    id: 'championship', name: 'EFL Championship', shortName: 'Champ.',
    logo: 'https://upload.wikimedia.org/wikipedia/en/3/36/EFL_Championship.svg',
    accent: '#3b82f6', type: 'league', country: 'England', founded: 2004, teams: 24, prize: '£180M+',
    prose: `The EFL Championship was created in 2004 when the Football League First Division was rebranded. With 24 clubs and 46 league matches, it immediately established itself as the most physically and mentally demanding second division in world football. The question every season is not whether it will produce drama — it always does — but which form that drama will take.\n\nThe play-off final, held at Wembley in late May, is described as the richest single match in football. Promotion to the Premier League can be worth over £200 million in broadcasting rights, prize money and commercial value. Brentford's 2021 victory — after 73 years outside the top flight, with a model built on data analytics and collective intelligence — was both an underdog story and a statement about how football itself was evolving.\n\nFor clubs like Leeds, Sunderland and Sheffield Wednesday — former Premier League sides with giant fanbases — the Championship is a painful exile. For clubs who have used it as a launchpad, it is proof that the quality of the competition prepares sides well for whatever comes next. No league in England tests a club's culture and resilience as completely as this one.`,
  },
  'League One': {
    id: 'leagueone', name: 'EFL League One', shortName: 'Lg One',
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/0d/EFL_League_One_logo.svg',
    accent: '#93c5fd', type: 'league', country: 'England', founded: 2004, teams: 24, prize: '£500K',
    prose: `EFL League One became England's third professional tier in 2004. It is a division defined by contrast — former Premier League clubs falling through the divisions sit alongside ambitious sides pushing for their first taste of Championship football. The gap in expectation between the clubs at the top and bottom can be enormous, and navigating that gap over 46 matches requires a specific kind of management and character.\n\nThe competition produces its own FA Cup magic. League One clubs have knocked out Premier League sides in early rounds often enough that it is no longer surprising — only delightful. Shrewsbury Town forcing a replay against Manchester United in 2019 demonstrated again that the third tier contains footballers capable of embarrassing anyone on a given day.\n\nIpswich Town's story is the modern League One legend. A former UEFA Cup winner stranded in the third tier, before Kieran McKenna arrived and turned them into back-to-back champions — League One title in 2023, Championship in 2024, Premier League the following season. From the third tier to the top flight in two years. League One is where it started.`,
  },
  'League Two': {
    id: 'leaguetwo', name: 'EFL League Two', shortName: 'Lg Two',
    logo: 'https://upload.wikimedia.org/wikipedia/en/1/13/EFL_League_Two_logo.svg',
    accent: '#bfdbfe', type: 'league', country: 'England', founded: 2004, teams: 24, prize: '£250K',
    prose: `EFL League Two is England's fourth professional tier — the bottom division of the Football League. The stakes here are existential in both directions. Promotion to League One opens new possibilities. Relegation to the National League can trigger financial crisis and a restructuring that takes years to recover from.\n\nWraxham AFC's story is the most widely told in the division's recent history. Ryan Reynolds and Rob McElhenney's 2020 takeover made it global news in a way League Two rarely achieves. Their promotion back to the Football League in 2023 after 15 years away, followed by back-to-back promotions to reach League One — a division they had not competed in since the 1980s — unfolded in real time as a documentary series watched by millions who had never previously cared about fourth-tier English football.\n\nStockport County's parallel resurrection — from Conference survival to League One contenders in the same period — is another story of supporters and infrastructure pulling a club back towards where its history suggested it belonged. League Two is full of these stories. Everything here is earned.`,
  },
};

/* ─────────────────────────────────────────
   CLUB → COMPETITIONS MAP
───────────────────────────────────────── */
const CLUB_COMPETITIONS = {
  'Manchester City':    ['Premier League','FA Cup','Carabao Cup','Champions League','UEFA Super Cup','FIFA Club World Cup'],
  'Liverpool':          ['Premier League','FA Cup','Carabao Cup','Champions League'],
  'Arsenal':            ['Premier League','FA Cup','Carabao Cup','Champions League'],
  'Chelsea':            ['Premier League','FA Cup','Carabao Cup','Conference League'],
  'Manchester United':  ['Premier League','FA Cup','Carabao Cup','Europa League'],
  'Tottenham':          ['Premier League','FA Cup','Carabao Cup','Europa League'],
  'Aston Villa':        ['Premier League','FA Cup','Carabao Cup','Champions League'],
  'Brighton':           ['Premier League','FA Cup','Carabao Cup','Europa League'],
  'Leeds United':       ['Championship','FA Cup','Carabao Cup'],
  'Sunderland':         ['Championship','FA Cup','Carabao Cup'],
  'Sheffield Wednesday':['Championship','FA Cup','Carabao Cup'],
  'Burnley':            ['Championship','FA Cup','Carabao Cup'],
  'Norwich City':       ['Championship','FA Cup','Carabao Cup'],
  'Middlesbrough':      ['Championship','FA Cup','Carabao Cup'],
  'Coventry City':      ['Championship','FA Cup','Carabao Cup'],
  'Derby County':       ['Championship','FA Cup','Carabao Cup'],
  'Portsmouth':         ['League One','FA Cup','Carabao Cup'],
  'Peterborough':       ['League One','FA Cup','Carabao Cup'],
  'Wigan Athletic':     ['League One','FA Cup','Carabao Cup'],
  'Charlton Athletic':  ['League One','FA Cup','Carabao Cup'],
  'Wrexham':            ['League Two','FA Cup','Carabao Cup'],
  'Stockport County':   ['League Two','FA Cup','Carabao Cup'],
  'Bradford City':      ['League Two','FA Cup','Carabao Cup'],
  'Real Madrid':        ['La Liga','Copa del Rey','Supercopa de España','Champions League','UEFA Super Cup','FIFA Club World Cup','FIFA Intercontinental Cup'],
  'Barcelona':          ['La Liga','Copa del Rey','Supercopa de España','Champions League'],
  'Atletico Madrid':    ['La Liga','Copa del Rey','Champions League'],
  'Bayer Leverkusen':   ['Bundesliga','DFB-Pokal','Champions League'],
  'Bayern Munich':      ['Bundesliga','DFB-Pokal','Champions League','UEFA Super Cup','FIFA Club World Cup'],
  'Borussia Dortmund':  ['Bundesliga','DFB-Pokal','Champions League'],
  'PSG':                ['Ligue 1','Coupe de France','Champions League'],
  'AC Milan':           ['Serie A','Coppa Italia','Champions League'],
  'Inter Milan':        ['Serie A','Coppa Italia','Champions League'],
  'Juventus':           ['Serie A','Coppa Italia','Europa League'],
};

const CLUB_COLOR = {
  'Real Madrid':'#FEBE10','Barcelona':'#A50044','Manchester City':'#6CABDD',
  'Liverpool':'#C8102E','Arsenal':'#EF0107','Chelsea':'#034694',
  'Manchester United':'#DA291C','Tottenham':'#132257','Bayern Munich':'#DC052D',
  'PSG':'#003370','AC Milan':'#FB090B','Inter Milan':'#0068A8',
  'Atletico Madrid':'#CB3524','Bayer Leverkusen':'#E32221',
  'Brighton':'#0057B8','Aston Villa':'#670E36',
  'Borussia Dortmund':'#FDE100','Juventus':'#555',
};

const CLUB_BADGE_URL = {
  'Manchester City':'https://resources.premierleague.com/premierleague/badges/50/t43.png',
  'Liverpool':'https://resources.premierleague.com/premierleague/badges/50/t14.png',
  'Arsenal':'https://resources.premierleague.com/premierleague/badges/50/t3.png',
  'Chelsea':'https://resources.premierleague.com/premierleague/badges/50/t8.png',
  'Manchester United':'https://resources.premierleague.com/premierleague/badges/50/t1.png',
  'Tottenham':'https://resources.premierleague.com/premierleague/badges/50/t6.png',
  'Aston Villa':'https://resources.premierleague.com/premierleague/badges/50/t7.png',
  'Brighton':'https://resources.premierleague.com/premierleague/badges/50/t36.png',
};

/* ─────────────────────────────────────────
   CARD IMAGES
───────────────────────────────────────── */
const COMP_IMAGES = {
  pl:           ['https://images.unsplash.com/photo-1683838946268-e0db005a09b4?w=500&auto=format&fit=crop&q=60'],
  laliga:       ['https://images.unsplash.com/photo-1585170236738-aadfce97f025?w=500&auto=format&fit=crop&q=60'],
  ucl:          ['https://images.unsplash.com/photo-1676746424114-56d38af59256?w=500&auto=format&fit=crop&q=60'],
  facup:        ['https://images.unsplash.com/photo-1698920466822-4b0eea9e64c8?w=500&auto=format&fit=crop&q=60'],
  uefasupercup: ['https://images.unsplash.com/photo-1705593973313-75de7bf95b56?w=500&auto=format&fit=crop&q=60'],
  cwc: [
    'https://images.unsplash.com/photo-1779809140099-a0a5c75af2af?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1657824983374-e80b2ed215b0?q=80&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1716463312341-00cd840a423c?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1653937014778-15ca333078ad?w=500&auto=format&fit=crop&q=60',
  ],
  _default: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60'],
};

/* ─────────────────────────────────────────
   BADGE — SVG shield fallback (same as Home.jsx)
───────────────────────────────────────── */
function ClubBadgeFallback({ name, color, size = 20 }) {
  const c = color || '#888';
  const hash = (name||'').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const style = hash % 5;
  const s = size;
  const half = s / 2;
  const shields = [
    `M ${half} ${s*.06} L ${s*.92} ${s*.22} L ${s*.92} ${s*.58} Q ${s*.92} ${s*.82} ${half} ${s*.96} Q ${s*.08} ${s*.82} ${s*.08} ${s*.58} L ${s*.08} ${s*.22} Z`,
    `M ${s*.1} ${s*.28} Q ${s*.1} ${s*.08} ${half} ${s*.06} Q ${s*.9} ${s*.08} ${s*.9} ${s*.28} L ${s*.9} ${s*.62} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.62} Z`,
    `M ${s*.1} ${s*.1} L ${s*.9} ${s*.1} L ${s*.9} ${s*.65} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.65} Z`,
    `M ${half} ${s*.04} L ${s*.9} ${s*.26} L ${s*.9} ${s*.68} L ${half} ${s*.96} L ${s*.1} ${s*.68} L ${s*.1} ${s*.26} Z`,
    `M ${s*.1} ${s*.18} L ${s*.35} ${s*.06} L ${half} ${s*.14} L ${s*.65} ${s*.06} L ${s*.9} ${s*.18} L ${s*.9} ${s*.62} Q ${s*.9} ${s*.84} ${half} ${s*.96} Q ${s*.1} ${s*.84} ${s*.1} ${s*.62} Z`,
  ];
  const abbr = (name||'').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const uid = `fb-${abbr}-${size}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c} stopOpacity="0.45"/>
          <stop offset="100%" stopColor={c} stopOpacity="0.15"/>
        </linearGradient>
      </defs>
      <path d={shields[style]} fill={`url(#${uid})`} stroke={c} strokeWidth={Math.max(0.8, s * 0.04)} strokeLinejoin="round"/>
      <text x={half} y={half + s * 0.07} textAnchor="middle"
        fontFamily="'Barlow Condensed',sans-serif" fontWeight="900"
        fontSize={s * 0.28} fill={c} letterSpacing={s * 0.01}>{abbr}</text>
    </svg>
  );
}

function ClubBadge({ name, size = 20 }) {
  const url = CLUB_BADGE_URL[name];
  const color = CLUB_COLOR[name] || '#888';
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    return (
      <img src={url} alt={name}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
        onError={() => setFailed(true)}
      />
    );
  }
  return <ClubBadgeFallback name={name} color={color} size={size} />;
}

/* ─────────────────────────────────────────
   COMP CARD (Transfers-style)
───────────────────────────────────────── */
function CompCard({ comp, onSelect }) {
  const images = COMP_IMAGES[comp.id] || COMP_IMAGES._default;
  const isSlideshow = images.length > 1;
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    if (!isSlideshow) return;
    const interval = setInterval(() => {
      setImgIndex(idx => (idx + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isSlideshow, images.length]);

  return (
    <button
      onClick={() => onSelect(comp)}
      style={{
        position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block',
        WebkitTapHighlightColor: 'transparent',
        background: 'rgba(255,255,255,0.02)', borderRadius: 4,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      {/* Stacked bg images — all mounted, opacity transitions between them */}
      {images.map((src, i) => (
        <div key={src} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: i === imgIndex ? 0.65 : 0,
          transition: 'opacity 1.2s ease',
        }} />
      ))}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(7,10,15,0.05) 0%, rgba(7,10,15,0.82) 100%)',
      }} />

      {/* Content bottom */}
      <div style={{ position: 'relative', height: '100%', padding: '18px 16px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {/* Name */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, fontStyle: 'italic', color: '#f0f2f5', letterSpacing: 0.5, lineHeight: 1, marginBottom: 5 }}>{comp.name}</div>

        {/* Founded · Country */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#9aa3b2', letterSpacing: 1.5, textTransform: 'uppercase' }}>{comp.country} · Est. {comp.founded}</div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────
   SCREEN 1 — LIST
───────────────────────────────────────── */
function CompListScreen({ comps, onSelect }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridAutoRows: '190px', gap: 10 }}>
        {comps.map(comp => (
          <CompCard key={comp.id} comp={comp} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 2 — DETAIL (full bg, prose)
───────────────────────────────────────── */
function CompDetailScreen({ comp, onBack, onContinue }) {
  const images = COMP_IMAGES[comp.id] || COMP_IMAGES._default;
  const bgImage = images[0];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Full background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.28 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,10,15,0.5) 0%, rgba(7,10,15,0.97) 45%)' }} />

      {/* Back arrow */}
      <button onClick={onBack} style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        background: 'none', border: 'none', cursor: 'pointer', padding: 6,
        color: 'rgba(255,255,255,0.5)', WebkitTapHighlightColor: 'transparent',
        display: 'flex', alignItems: 'center', transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, padding: '90px 24px 0' }}>
        {/* Name only — no logo */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, fontStyle: 'italic', color: '#f0f2f5', letterSpacing: 0.5, lineHeight: 1.05 }}>{comp.name}</div>
        </div>

        {/* Quick stat row — inline, no boxes */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 28 }}>
          {[['Founded', comp.founded], ['Clubs', comp.teams], ['Prize', comp.prize]].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 900, fontStyle: 'italic', color: comp.accent, lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#556070', letterSpacing: 2, textTransform: 'uppercase', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Prose */}
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(240,242,245,0.75)', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
          {comp.prose}
        </div>

        {/* Spacer so content clears the sticky button */}
        <div style={{ height: 90 }} />
      </div>

      {/* Sticky Continue button */}
      <div style={{ position: 'relative', zIndex: 2, padding: '14px 16px', background: 'linear-gradient(to top, rgba(7,10,15,1) 70%, transparent)' }}>
        <button onClick={onContinue} style={{
          width: '100%', padding: '13px 0',
          background: comp.accent, color: '#000',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900,
          letterSpacing: 3, textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'filter 0.15s', WebkitTapHighlightColor: 'transparent',
          borderRadius: 2,
        }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          {comp.type === 'league' ? 'View Table & Stats' : 'View Rounds & Results'}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SUB-NAV
───────────────────────────────────────── */
function SubNav({ tabs, active, onChange, accent }) {
  return (
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '0 12px 10px', scrollbarWidth: 'none', flexShrink: 0 }}>
      {tabs.map(tab => (
        <button key={tab} onClick={() => onChange(tab)} style={{
          flexShrink: 0, padding: '5px 12px',
          border: `1px solid ${active === tab ? (accent||'var(--green)') : 'rgba(255,255,255,0.08)'}`,
          background: active === tab ? `${accent||'var(--green)'}18` : 'transparent',
          color: active === tab ? (accent||'var(--green)') : 'rgba(255,255,255,0.35)',
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5,
          textTransform: 'uppercase', cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s',
        }}>{tab}</button>
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
      {[2,1,1,1,1,1].map((f,i) => <div key={i} style={{ height: 9, borderRadius: 3, background: 'rgba(255,255,255,0.05)', flex: f }} />)}
    </div>
  );
}

function Empty({ label }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
  );
}

/* Table */
function TableTab({ myClub, accentColor, leagueTable }) {
  const rows = leagueTable?.length ? leagueTable : null;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 28px 28px 28px 28px 32px 36px', gap: 4, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['#','Club','P','W','D','L','GD','Pts'].map(h => <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: h === 'Club' ? 'left' : 'center' }}>{h}</span>)}
      </div>
      {rows ? rows.map((row, i) => (
        <div key={row.clubName} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 28px 28px 28px 28px 32px 36px', gap: 4, padding: '8px 14px', background: row.isUser ? `${accentColor}12` : 'transparent', borderLeft: row.isUser ? `2px solid ${accentColor}` : '2px solid transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: row.isUser ? accentColor : 'rgba(255,255,255,0.3)', textAlign: 'center', alignSelf: 'center' }}>{i+1}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <ClubBadge name={row.clubName} size={15} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: row.isUser ? '#f0f2f5' : 'rgba(240,242,245,0.6)', fontWeight: row.isUser ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.clubName}</span>
          </div>
          {[row.played,row.won,row.drawn,row.lost,row.goalDifference>0?`+${row.goalDifference}`:row.goalDifference,row.points].map((v,j) => (
            <span key={j} style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: j===5?800:600, color: j===5&&row.isUser?accentColor:'#f0f2f5', textAlign: 'center', alignSelf: 'center' }}>{v}</span>
          ))}
        </div>
      )) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 28px 28px 28px 28px 32px 36px', gap: 4, padding: '9px 14px', background: `${accentColor}10`, borderLeft: `2px solid ${accentColor}`, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accentColor, textAlign: 'center', alignSelf: 'center', fontWeight: 700 }}>1</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClubBadge name={myClub?.name} size={16} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#f0f2f5', fontWeight: 600 }}>{myClub?.name}</span>
            </div>
            {['0','0','0','0','0','0'].map((v,i) => <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: '#f0f2f5', textAlign: 'center', alignSelf: 'center' }}>{v}</span>)}
          </div>
          {Array.from({length:7}).map((_,i) => <SkeletonRow key={i} />)}
        </>
      )}
    </div>
  );
}

/* Goals */
function GoalsTab({ allPlayers, leagueTable, accent }) {
  const scorers = useMemo(() => {
    if (!allPlayers?.length) return [];
    const clubs = leagueTable?.map(r => r.clubName) || [];
    return allPlayers
      .filter(p => !clubs.length || clubs.includes(p.club))
      .filter(p => ['ST','CF','LW','RW','CAM','CM'].includes(p.position))
      .map(p => ({ ...p, goals: Math.max(0, Math.round(((p.shooting||60)-40)/8 + (Math.random()*4-1))) }))
      .filter(p => p.goals > 0)
      .sort((a,b) => b.goals - a.goals)
      .slice(0, 20);
  }, [allPlayers, leagueTable]);

  if (!scorers.length) return <Empty label="Play matches to see the golden boot race" />;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto 40px', gap: 4, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['#','Player','Club','G'].map(h => <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: h==='Player'?'left':'center' }}>{h}</span>)}
      </div>
      {scorers.map((p,i) => (
        <div key={p.id||i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto 40px', gap: 4, padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i<3?accent:'rgba(255,255,255,0.3)', textAlign: 'center', alignSelf: 'center', fontWeight: i<3?700:400 }}>{i+1}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${CLUB_COLOR[p.club]||'#444'}33`, border: `1px solid ${CLUB_COLOR[p.club]||'#444'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{p.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#f0f2f5', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>{p.position}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, alignSelf: 'center' }}>
            <ClubBadge name={p.club} size={13} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.club}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: i<3?accent:'#f0f2f5', textAlign: 'center', alignSelf: 'center' }}>{p.goals}</span>
        </div>
      ))}
    </div>
  );
}

/* Assists */
function AssistsTab({ allPlayers, leagueTable, accent }) {
  const assisters = useMemo(() => {
    if (!allPlayers?.length) return [];
    const clubs = leagueTable?.map(r => r.clubName) || [];
    return allPlayers
      .filter(p => !clubs.length || clubs.includes(p.club))
      .filter(p => ['CAM','CM','LW','RW','LB','RB','CDM'].includes(p.position))
      .map(p => ({ ...p, assists: Math.max(0, Math.round(((p.passing||60)-45)/7 + (Math.random()*3-1))) }))
      .filter(p => p.assists > 0)
      .sort((a,b) => b.assists - a.assists)
      .slice(0, 20);
  }, [allPlayers, leagueTable]);

  if (!assisters.length) return <Empty label="Play matches to see the assists chart" />;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto 40px', gap: 4, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['#','Player','Club','A'].map(h => <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: h==='Player'?'left':'center' }}>{h}</span>)}
      </div>
      {assisters.map((p,i) => (
        <div key={p.id||i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto 40px', gap: 4, padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i<3?accent:'rgba(255,255,255,0.3)', textAlign: 'center', alignSelf: 'center', fontWeight: i<3?700:400 }}>{i+1}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${CLUB_COLOR[p.club]||'#444'}33`, border: `1px solid ${CLUB_COLOR[p.club]||'#444'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{p.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#f0f2f5', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>{p.position}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, alignSelf: 'center' }}>
            <ClubBadge name={p.club} size={13} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.club}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: i<3?accent:'#f0f2f5', textAlign: 'center', alignSelf: 'center' }}>{p.assists}</span>
        </div>
      ))}
    </div>
  );
}

/* Results */
function ResultsTab({ results, myClub }) {
  if (!results?.length) return <Empty label="No results yet this season" />;
  return (
    <div>
      {results.slice().reverse().map((result, i) => {
        const myGoals  = result.isHome ? result.homeGoals : result.awayGoals;
        const oppGoals = result.isHome ? result.awayGoals : result.homeGoals;
        const outcome  = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
        const oc = outcome==='W'?'#00e87a':outcome==='D'?'#f5c518':'#ff3b5c';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: `2px solid ${oc}` }}>
            <div style={{ width: 26, height: 26, borderRadius: 4, flexShrink: 0, background: `${oc}15`, border: `1px solid ${oc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800, color: oc }}>{outcome}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <ClubBadge name={myClub?.name} size={14} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900, color: '#f0f2f5' }}>{myGoals}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>–</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900, color: '#f0f2f5' }}>{oppGoals}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(240,242,245,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.opponent||'Opponent'}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{result.competition||'League'} · Wk {result.week||'—'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Rounds */
function RoundsTab({ comp }) {
  const rounds = (comp.rounds||['R1','QF','SF','F']).filter(r => r !== 'League Phase');
  return (
    <div style={{ padding: '12px 14px' }}>
      {comp.hasGroups && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: comp.accent, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>League Phase</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {['Group A','Group B','Group C','Group D'].map(g => (
              <div key={g} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: comp.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{g}</div>
                {Array.from({length:4}).map((_,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: i<3?'1px solid rgba(255,255,255,0.04)':'none' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ flex: 1, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ width: 16, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: comp.accent, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Knockout Bracket</div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
        {rounds.map((r,i) => (
          <div key={r} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', height: 3, borderRadius: 2, background: i===0?comp.accent:'rgba(255,255,255,0.08)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: i===0?comp.accent:'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>{r}</span>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', padding: '14px', borderRadius: 8 }}>
        {Array.from({length:4}).map((_,i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i<3?'1px solid rgba(255,255,255,0.04)':'none' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 18, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ height: 9, borderRadius: 2, background: 'rgba(255,255,255,0.05)', width: '60%' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>vs</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <div style={{ height: 9, borderRadius: 2, background: 'rgba(255,255,255,0.05)', width: '60%' }} />
              <div style={{ width: 18, height: 18, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }} />
            </div>
          </div>
        ))}
        <div style={{ paddingTop: 10, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, textTransform: 'uppercase' }}>Draw populates before each round</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 3 — TABS
───────────────────────────────────────── */
function CompTabsScreen({ comp, onBack, myClub, accentColor, leagueTable, allPlayers, results, season }) {
  const isLeague = comp.type === 'league';
  const tabs = isLeague ? ['Table','Goals','Assists','Results'] : ['Rounds','Results'];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const images = COMP_IMAGES[comp.id] || COMP_IMAGES._default;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Background — more visible at top, fades down */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center top', opacity: 0.32 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,10,15,0.4) 0%, rgba(7,10,15,0.97) 50%)' }} />

      {/* Header: back arrow on its own line, then comp name bigger below */}
      <div style={{ position: 'relative', zIndex: 1, padding: '16px 18px 0', flexShrink: 0 }}>
        {/* Row 1: back arrow + season badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 8px' }}>S{season}</div>
        </div>

        {/* Row 2: comp name — bigger, standalone */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, fontStyle: 'italic', color: '#f0f2f5', letterSpacing: 0.5, lineHeight: 1, marginBottom: 20 }}>{comp.name}</div>
      </div>

      {/* Sub-nav */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, paddingBottom: 4 }}>
        <SubNav tabs={tabs} active={activeTab} onChange={setActiveTab} accent={comp.accent} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'rgba(7,10,15,0.7)', margin: '0 10px 10px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
          {isLeague && activeTab === 'Table'   && <div style={{ maxHeight: 420, overflowY: 'auto' }}><TableTab myClub={myClub} accentColor={accentColor} leagueTable={leagueTable} /></div>}
          {isLeague && activeTab === 'Goals'   && <div style={{ maxHeight: 420, overflowY: 'auto' }}><GoalsTab allPlayers={allPlayers} leagueTable={leagueTable} accent={comp.accent} /></div>}
          {isLeague && activeTab === 'Assists' && <div style={{ maxHeight: 420, overflowY: 'auto' }}><AssistsTab allPlayers={allPlayers} leagueTable={leagueTable} accent={comp.accent} /></div>}
          {activeTab === 'Results'             && <div style={{ maxHeight: 420, overflowY: 'auto' }}><ResultsTab results={results} myClub={myClub} /></div>}
          {!isLeague && activeTab === 'Rounds' && <RoundsTab comp={comp} />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
export default function Competitions() {
  const { myClub, results, season, leagueTable, allPlayers } = useGameStore();
  const [screen, setScreen] = useState('list');
  const [selectedComp, setSelectedComp] = useState(null);
  const [fromDetail, setFromDetail] = useState(false);
  const accentColor = CLUB_COLOR[myClub?.name] || '#00e87a';

  // Track which comp detail screens have been seen this career
  // Key includes club name so it resets on new game / club change
  const seenKey = `gaffer-seen-comps-${myClub?.name || 'none'}`;
  const getSeenComps = () => {
    try { return new Set(JSON.parse(localStorage.getItem(seenKey) || '[]')); }
    catch { return new Set(); }
  };
  const markSeen = (compId) => {
    try {
      const seen = getSeenComps();
      seen.add(compId);
      localStorage.setItem(seenKey, JSON.stringify([...seen]));
    } catch {}
  };

  const clubCompetitions = useMemo(() => {
    const names = CLUB_COMPETITIONS[myClub?.name] || ['Premier League','FA Cup','Carabao Cup'];
    return names.map(n => COMPETITIONS[n]).filter(Boolean);
  }, [myClub]);

  const handleSelectComp = (comp) => {
    setSelectedComp(comp);
    const seen = getSeenComps();
    if (seen.has(comp.id)) {
      setScreen('tabs');
      setFromDetail(false);
    } else {
      setScreen('detail');
      setFromDetail(false);
    }
  };

  const handleContinue = () => {
    if (selectedComp) markSeen(selectedComp.id);
    setFromDetail(true);
    setScreen('tabs');
  };

  return (
    <>
      <style>{`
        @keyframes pageIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        .s-list   { animation: pageIn  0.25s ease both; }
        .s-detail { animation: slideIn 0.22s ease both; }
        .s-tabs   { animation: slideIn 0.2s  ease both; }
      `}</style>

      <div style={{ height: '100%', background: 'rgba(7,10,15,1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {screen === 'list' && (
          <div className="s-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <CompListScreen comps={clubCompetitions} onSelect={handleSelectComp} />
          </div>
        )}

        {screen === 'detail' && selectedComp && (
          <div className="s-detail" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <CompDetailScreen
              comp={selectedComp}
              onBack={() => { setScreen('list'); setSelectedComp(null); }}
              onContinue={handleContinue}
            />
          </div>
        )}

        {screen === 'tabs' && selectedComp && (
          <div className="s-tabs" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <CompTabsScreen
              comp={selectedComp}
              onBack={() => {
                if (fromDetail) {
                  setScreen('detail');
                } else {
                  setSelectedComp(null);
                  setScreen('list');
                }
              }}
              myClub={myClub}
              accentColor={accentColor}
              leagueTable={leagueTable}
              allPlayers={allPlayers}
              results={results}
              season={season}
            />
          </div>
        )}

      </div>
    </>
  );
}