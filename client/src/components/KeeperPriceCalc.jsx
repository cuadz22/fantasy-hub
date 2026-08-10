import { useState, useMemo } from 'react';

// Owner → 2025 team name mapping
const TEAM_OWNERS = {
  'To Infinity and Bijan': 'Kevin Huertas',
  'Stiff Arm That Njigba': 'Big Vic',
  'Hooligans': 'Alexis',
  'bichote': 'Jose',
  'Rents Due': 'Giovanny',
  'Straight Outta Hampton': 'JJ',
  'Buck You': 'Alex Zarate',
  'Nacua Matata': 'Oscar',
  'Killer Instinct': 'Ed',
  'Ashton 316': 'Cristian',
  'LaPorta Potty': 'Hihi',
  'Manifested It': 'Jonathan',
};

const TEAMS = Object.keys(TEAM_OWNERS);

// Players who were keepers heading into the 2025 season
const KEEPERS_FOR_2025 = [
  { player: 'Joe Burrow', team: 'Hooligans', year: 2, round: 6 },
  { player: 'Brian Thomas Jr.', team: 'Hooligans', year: 1, round: 10 },
  { player: 'Puka Nacua', team: 'Nacua Matata', year: 2, round: 6 },
  { player: 'Chase Brown', team: 'Nacua Matata', year: 1, round: 10 },
  { player: 'Jared Goff', team: 'Ashton 316', year: 2, round: 3 },
  { player: 'Brock Purdy', team: 'Ashton 316', year: 2, round: 7 },
  { player: 'Malik Nabers', team: 'To Infinity and Bijan', year: 1, round: 2 },
  { player: 'Bo Nix', team: 'To Infinity and Bijan', year: 1, round: 12 },
  { player: 'Ladd McConkey', team: 'LaPorta Potty', year: 1, round: 7 },
  { player: 'Baker Mayfield', team: 'LaPorta Potty', year: 1, round: 9 },
  { player: 'C.J. Stroud', team: 'bichote', year: 1, round: 9 },
  { player: 'Drake Maye', team: 'bichote', year: 1, round: 12 },
  { player: 'Jayden Daniels', team: 'Rents Due', year: 1, round: 4 },
  { player: 'Trey McBride', team: 'Rents Due', year: 1, round: 5 },
  { player: 'Garrett Wilson', team: 'Manifested It', year: 1, round: 10 },
  { player: 'Kyler Murray', team: 'Manifested It', year: 1, round: 10 },
  { player: 'Jordan Love', team: 'Buck You', year: 2, round: 7 },
  { player: 'Bucky Irving', team: 'Buck You', year: 1, round: 16 },
  { player: 'Justin Jefferson', team: 'Straight Outta Hampton', year: 1, round: 3 },
  { player: 'J.J. McCarthy', team: 'Straight Outta Hampton', year: 1, round: 15 },
  { player: 'Nico Collins', team: 'Killer Instinct', year: 2, round: 9 },
  { player: "De'Von Achane", team: 'Killer Instinct', year: 2, round: 12 },
  { player: 'Kyren Williams', team: 'Stiff Arm That Njigba', year: 1, round: 6 },
  { player: 'Brock Bowers', team: 'Stiff Arm That Njigba', year: 1, round: 10 },
];

const KEEPER_NAMES_2025 = new Set(KEEPERS_FOR_2025.map(k => k.player));

// Full 2025 draft (204 picks across 17 rounds)
const DRAFT_2025 = [
  // Round 1
  { round: 1, player: 'Josh Allen', team: 'To Infinity and Bijan' },
  { round: 1, player: 'Lamar Jackson', team: 'Stiff Arm That Njigba' },
  { round: 1, player: 'Bijan Robinson', team: 'Hooligans' },
  { round: 1, player: "Ja'Marr Chase", team: 'bichote' },
  { round: 1, player: 'Jahmyr Gibbs', team: 'Rents Due' },
  { round: 1, player: 'Jalen Hurts', team: 'Straight Outta Hampton' },
  { round: 1, player: 'CeeDee Lamb', team: 'Buck You' },
  { round: 1, player: 'Christian McCaffrey', team: 'To Infinity and Bijan' },
  { round: 1, player: 'Saquon Barkley', team: 'Nacua Matata' },
  { round: 1, player: 'Patrick Mahomes', team: 'Killer Instinct' },
  { round: 1, player: 'Ashton Jeanty', team: 'Ashton 316' },
  { round: 1, player: 'Amon-Ra St. Brown', team: 'LaPorta Potty' },
  // Round 2
  { round: 2, player: 'Drake London', team: 'LaPorta Potty' },
  { round: 2, player: 'Josh Jacobs', team: 'Ashton 316' },
  { round: 2, player: 'Derrick Henry', team: 'Killer Instinct' },
  { round: 2, player: 'Dak Prescott', team: 'Nacua Matata' },
  { round: 2, player: 'Malik Nabers', team: 'To Infinity and Bijan' },
  { round: 2, player: 'Jonathan Taylor', team: 'Buck You' },
  { round: 2, player: 'A.J. Brown', team: 'Straight Outta Hampton' },
  { round: 2, player: 'Justin Fields', team: 'Rents Due' },
  { round: 2, player: 'Omarion Hampton', team: 'bichote' },
  { round: 2, player: 'Tee Higgins', team: 'Hooligans' },
  { round: 2, player: 'Jaxon Smith-Njigba', team: 'Stiff Arm That Njigba' },
  { round: 2, player: 'Justin Herbert', team: 'Manifested It' },
  // Round 3
  { round: 3, player: 'James Cook III', team: 'LaPorta Potty' },
  { round: 3, player: 'Caleb Williams', team: 'Stiff Arm That Njigba' },
  { round: 3, player: 'Trevor Lawrence', team: 'Hooligans' },
  { round: 3, player: 'Tyreek Hill', team: 'Manifested It' },
  { round: 3, player: 'Terry McLaurin', team: 'Rents Due' },
  { round: 3, player: 'Justin Jefferson', team: 'Straight Outta Hampton' },
  { round: 3, player: 'Mike Evans', team: 'Buck You' },
  { round: 3, player: 'Kenneth Walker III', team: 'LaPorta Potty' },
  { round: 3, player: 'George Kittle', team: 'Nacua Matata' },
  { round: 3, player: 'Davante Adams', team: 'Killer Instinct' },
  { round: 3, player: 'Jared Goff', team: 'Ashton 316' },
  { round: 3, player: 'TreVeyon Henderson', team: 'LaPorta Potty' },
  // Round 4
  { round: 4, player: 'Tetairoa McMillan', team: 'LaPorta Potty' },
  { round: 4, player: 'Marvin Harrison Jr.', team: 'Ashton 316' },
  { round: 4, player: 'Alvin Kamara', team: 'Killer Instinct' },
  { round: 4, player: 'George Pickens', team: 'Straight Outta Hampton' },
  { round: 4, player: 'Breece Hall', team: 'Manifested It' },
  { round: 4, player: 'Tua Tagovailoa', team: 'Buck You' },
  { round: 4, player: 'James Conner', team: 'Straight Outta Hampton' },
  { round: 4, player: 'Jayden Daniels', team: 'Rents Due' },
  { round: 4, player: 'Chuba Hubbard', team: 'bichote' },
  { round: 4, player: 'Jaylen Waddle', team: 'To Infinity and Bijan' },
  { round: 4, player: 'Isiah Pacheco', team: 'Stiff Arm That Njigba' },
  { round: 4, player: 'Jameson Williams', team: 'Straight Outta Hampton' },
  // Round 5
  { round: 5, player: "D'Andre Swift", team: 'Straight Outta Hampton' },
  { round: 5, player: 'Tony Pollard', team: 'bichote' },
  { round: 5, player: 'Xavier Worthy', team: 'Hooligans' },
  { round: 5, player: 'DeVonta Smith', team: 'bichote' },
  { round: 5, player: 'Trey McBride', team: 'Rents Due' },
  { round: 5, player: 'Calvin Ridley', team: 'Straight Outta Hampton' },
  { round: 5, player: 'DK Metcalf', team: 'To Infinity and Bijan' },
  { round: 5, player: 'David Montgomery', team: 'To Infinity and Bijan' },
  { round: 5, player: 'Emeka Egbuka', team: 'Nacua Matata' },
  { round: 5, player: 'Bryce Young', team: 'Killer Instinct' },
  { round: 5, player: 'Ricky Pearsall', team: 'Ashton 316' },
  { round: 5, player: 'Michael Penix Jr.', team: 'LaPorta Potty' },
  // Round 6
  { round: 6, player: 'RJ Harvey', team: 'LaPorta Potty' },
  { round: 6, player: 'Matthew Golden', team: 'Ashton 316' },
  { round: 6, player: 'Courtland Sutton', team: 'Killer Instinct' },
  { round: 6, player: 'Puka Nacua', team: 'Nacua Matata' },
  { round: 6, player: 'Aaron Jones Sr.', team: 'Manifested It' },
  { round: 6, player: 'DJ Moore', team: 'Buck You' },
  { round: 6, player: 'Chris Olave', team: 'Rents Due' },
  { round: 6, player: 'Zay Flowers', team: 'Rents Due' },
  { round: 6, player: 'Sam LaPorta', team: 'To Infinity and Bijan' },
  { round: 6, player: 'Kaleb Johnson', team: 'Hooligans' },
  { round: 6, player: 'Kyren Williams', team: 'Stiff Arm That Njigba' },
  { round: 6, player: 'Joe Burrow', team: 'Hooligans' },
  // Round 7
  { round: 7, player: 'Rome Odunze', team: 'Nacua Matata' },
  { round: 7, player: 'Travis Hunter', team: 'Stiff Arm That Njigba' },
  { round: 7, player: 'Jaylen Warren', team: 'Hooligans' },
  { round: 7, player: 'Rashee Rice', team: 'bichote' },
  { round: 7, player: 'Tyrone Tracy Jr.', team: 'Rents Due' },
  { round: 7, player: 'J.K. Dobbins', team: 'Straight Outta Hampton' },
  { round: 7, player: 'Jordan Love', team: 'Buck You' },
  { round: 7, player: 'Cam Ward', team: 'Killer Instinct' },
  { round: 7, player: 'Matthew Stafford', team: 'Nacua Matata' },
  { round: 7, player: 'Travis Kelce', team: 'Killer Instinct' },
  { round: 7, player: 'Brock Purdy', team: 'Ashton 316' },
  { round: 7, player: 'Ladd McConkey', team: 'LaPorta Potty' },
  // Round 8
  { round: 8, player: 'Jordan Mason', team: 'To Infinity and Bijan' },
  { round: 8, player: 'Mark Andrews', team: 'Ashton 316' },
  { round: 8, player: 'Deebo Samuel Sr.', team: 'Killer Instinct' },
  { round: 8, player: 'Jaxson Dart', team: 'Nacua Matata' },
  { round: 8, player: 'Travis Etienne Jr.', team: 'Manifested It' },
  { round: 8, player: 'T.J. Hockenson', team: 'Buck You' },
  { round: 8, player: 'Tyler Warren', team: 'Straight Outta Hampton' },
  { round: 8, player: 'Khalil Shakir', team: 'To Infinity and Bijan' },
  { round: 8, player: 'Stefon Diggs', team: 'bichote' },
  { round: 8, player: 'Jerry Jeudy', team: 'Hooligans' },
  { round: 8, player: 'Javonte Williams', team: 'Stiff Arm That Njigba' },
  { round: 8, player: 'Zach Charbonnet', team: 'bichote' },
  // Round 9
  { round: 9, player: 'Jacory Croskey-Merritt', team: 'Buck You' },
  { round: 9, player: 'Josh Downs', team: 'Stiff Arm That Njigba' },
  { round: 9, player: 'Jake Ferguson', team: 'Hooligans' },
  { round: 9, player: 'C.J. Stroud', team: 'bichote' },
  { round: 9, player: 'Jakobi Meyers', team: 'Rents Due' },
  { round: 9, player: 'Braelon Allen', team: 'Straight Outta Hampton' },
  { round: 9, player: 'Geno Smith', team: 'Buck You' },
  { round: 9, player: 'Cooper Kupp', team: 'Nacua Matata' },
  { round: 9, player: 'Keon Coleman', team: 'Nacua Matata' },
  { round: 9, player: 'Nico Collins', team: 'Killer Instinct' },
  { round: 9, player: 'Darnell Mooney', team: 'Ashton 316' },
  { round: 9, player: 'Baker Mayfield', team: 'LaPorta Potty' },
  // Round 10
  { round: 10, player: 'Evan Engram', team: 'LaPorta Potty' },
  { round: 10, player: 'Bhayshul Tuten', team: 'Ashton 316' },
  { round: 10, player: 'Garrett Wilson', team: 'Manifested It' },
  { round: 10, player: 'Chase Brown', team: 'Nacua Matata' },
  { round: 10, player: 'Kyler Murray', team: 'Manifested It' },
  { round: 10, player: 'Jauan Jennings', team: 'Buck You' },
  { round: 10, player: 'Austin Ekeler', team: 'Straight Outta Hampton' },
  { round: 10, player: 'Tank Bigsby', team: 'Rents Due' },
  { round: 10, player: 'Rhamondre Stevenson', team: 'bichote' },
  { round: 10, player: 'Brian Thomas Jr.', team: 'Hooligans' },
  { round: 10, player: 'Brock Bowers', team: 'Stiff Arm That Njigba' },
  { round: 10, player: 'David Njoku', team: 'Manifested It' },
  // Round 11
  { round: 11, player: 'Nick Chubb', team: 'Manifested It' },
  { round: 11, player: 'Jayden Higgins', team: 'Stiff Arm That Njigba' },
  { round: 11, player: 'Jaydon Blue', team: 'Hooligans' },
  { round: 11, player: 'Jordan Addison', team: 'bichote' },
  { round: 11, player: 'Michael Pittman Jr.', team: 'To Infinity and Bijan' },
  { round: 11, player: 'Ray Davis', team: 'Straight Outta Hampton' },
  { round: 11, player: 'Rashid Shaheed', team: 'Buck You' },
  { round: 11, player: 'Trey Benson', team: 'Stiff Arm That Njigba' },
  { round: 11, player: 'Brian Robinson', team: 'Nacua Matata' },
  { round: 11, player: 'Jayden Reed', team: 'Killer Instinct' },
  { round: 11, player: 'Chris Godwin Jr.', team: 'Ashton 316' },
  { round: 11, player: 'Cam Skattebo', team: 'LaPorta Potty' },
  // Round 12
  { round: 12, player: 'Tucker Kraft', team: 'LaPorta Potty' },
  { round: 12, player: 'Christian Kirk', team: 'Ashton 316' },
  { round: 12, player: "De'Von Achane", team: 'Killer Instinct' },
  { round: 12, player: 'Colston Loveland', team: 'Nacua Matata' },
  { round: 12, player: 'Keenan Allen', team: 'Manifested It' },
  { round: 12, player: 'Sam Darnold', team: 'Buck You' },
  { round: 12, player: 'Broncos DEF', team: 'Straight Outta Hampton' },
  { round: 12, player: 'DeMario Douglas', team: 'Rents Due' },
  { round: 12, player: 'Drake Maye', team: 'bichote' },
  { round: 12, player: 'Rashod Bateman', team: 'Hooligans' },
  { round: 12, player: 'Marvin Mims Jr.', team: 'Stiff Arm That Njigba' },
  { round: 12, player: 'Bo Nix', team: 'To Infinity and Bijan' },
  // Round 13
  { round: 13, player: 'Quinshon Judkins', team: 'To Infinity and Bijan' },
  { round: 13, player: 'Ollie Gordon II', team: 'Stiff Arm That Njigba' },
  { round: 13, player: 'Joshua Palmer', team: 'Hooligans' },
  { round: 13, player: 'Dallas Goedert', team: 'bichote' },
  { round: 13, player: 'Cedric Tillman', team: 'Rents Due' },
  { round: 13, player: 'Joe Mixon', team: 'Straight Outta Hampton' },
  { round: 13, player: 'Kyle Williams', team: 'Buck You' },
  { round: 13, player: 'Aaron Rodgers', team: 'Manifested It' },
  { round: 13, player: 'Dylan Sampson', team: 'Nacua Matata' },
  { round: 13, player: 'Tyjae Spears', team: 'Killer Instinct' },
  { round: 13, player: 'DJ Giddens', team: 'Ashton 316' },
  { round: 13, player: 'Brandon Aiyuk', team: 'LaPorta Potty' },
  // Round 14
  { round: 14, player: 'Brandon Aubrey', team: 'LaPorta Potty' },
  { round: 14, player: 'Kyle Monangai', team: 'Ashton 316' },
  { round: 14, player: 'Troy Franklin', team: 'Killer Instinct' },
  { round: 14, player: "Tre' Harris", team: 'Nacua Matata' },
  { round: 14, player: 'Jerome Ford', team: 'Manifested It' },
  { round: 14, player: 'Eagles DEF', team: 'Buck You' },
  { round: 14, player: 'Russell Wilson', team: 'Straight Outta Hampton' },
  { round: 14, player: 'Tyler Allgeier', team: 'Rents Due' },
  { round: 14, player: 'Dalton Kincaid', team: 'bichote' },
  { round: 14, player: 'Kyle Pitts Sr.', team: 'Hooligans' },
  { round: 14, player: 'Tahj Brooks', team: 'Stiff Arm That Njigba' },
  { round: 14, player: 'Xavier Legette', team: 'Rents Due' },
  // Round 15
  { round: 15, player: 'Joe Flacco', team: 'To Infinity and Bijan' },
  { round: 15, player: 'Blake Corum', team: 'Stiff Arm That Njigba' },
  { round: 15, player: 'Rico Dowdle', team: 'Hooligans' },
  { round: 15, player: 'Anthony Richardson Sr.', team: 'bichote' },
  { round: 15, player: 'Cameron Dicker', team: 'Rents Due' },
  { round: 15, player: 'J.J. McCarthy', team: 'Straight Outta Hampton' },
  { round: 15, player: 'Rachaad White', team: 'Buck You' },
  { round: 15, player: 'Bills DEF', team: 'LaPorta Potty' },
  { round: 15, player: 'Jake Bates', team: 'Nacua Matata' },
  { round: 15, player: 'Luther Burden III', team: 'Killer Instinct' },
  { round: 15, player: 'Adam Thielen', team: 'Ashton 316' },
  { round: 15, player: 'Cardinals DEF', team: 'LaPorta Potty' },
  // Round 16
  { round: 16, player: "Wan'Dale Robinson", team: 'Manifested It' },
  { round: 16, player: 'Hollywood Brown', team: 'Ashton 316' },
  { round: 16, player: '49ers DEF', team: 'Killer Instinct' },
  { round: 16, player: 'Ravens DEF', team: 'Nacua Matata' },
  { round: 16, player: 'Hunter Henry', team: 'Manifested It' },
  { round: 16, player: 'Bucky Irving', team: 'Buck You' },
  { round: 16, player: 'Steelers DEF', team: 'To Infinity and Bijan' },
  { round: 16, player: 'Shedeur Sanders', team: 'Rents Due' },
  { round: 16, player: "Ka'imi Fairbairn", team: 'bichote' },
  { round: 16, player: 'Vikings DEF', team: 'Hooligans' },
  { round: 16, player: 'Chiefs DEF', team: 'Stiff Arm That Njigba' },
  { round: 16, player: 'Romeo Doubs', team: 'To Infinity and Bijan' },
  // Round 17
  { round: 17, player: 'Jalen Coker', team: 'To Infinity and Bijan' },
  { round: 17, player: 'Lions DEF', team: 'Stiff Arm That Njigba' },
  { round: 17, player: 'Evan McPherson', team: 'Hooligans' },
  { round: 17, player: 'Isaiah Likely', team: 'bichote' },
  { round: 17, player: 'Chargers DEF', team: 'Rents Due' },
  { round: 17, player: 'Tyler Bass', team: 'To Infinity and Bijan' },
  { round: 17, player: 'Chris Boswell', team: 'Buck You' },
  { round: 17, player: 'Kareem Hunt', team: 'Manifested It' },
  { round: 17, player: 'DeAndre Hopkins', team: 'Manifested It' },
  { round: 17, player: 'Tyler Loop', team: 'Killer Instinct' },
  { round: 17, player: 'Packers DEF', team: 'Ashton 316' },
  { round: 17, player: 'Daniel Jones', team: 'Manifested It' },
];

// Waiver/FA adds in 2025 (all get Round 8 keeper price).
// Built from full 19-page transaction scrape. Each player listed under their
// end-of-season team (most recent add wins; dropped players excluded).
// Traded players who were originally drafted remain in DRAFT_2025 under their
// original team; only waiver/FA-acquired players appear here.
const WAIVER_FA_2025 = [
  // To Infinity and Bijan
  { player: 'Amari Cooper', team: 'To Infinity and Bijan', type: 'waiver' },
  { player: 'Tucker Kraft', team: 'To Infinity and Bijan', type: 'waiver' },      // LaPorta drafted Rd 12, waivered to To Infinity
  { player: 'Cedric Tillman', team: 'To Infinity and Bijan', type: 'fa' },        // Rents Due Rd 13 → FA add
  { player: 'Dallas Goedert', team: 'To Infinity and Bijan', type: 'waiver' },    // bichote Rd 13 → waiver add
  { player: 'Jayden Higgins', team: 'To Infinity and Bijan', type: 'fa' },        // Stiff Arm Rd 11 → FA add
  { player: 'Mark Andrews', team: 'To Infinity and Bijan', type: 'waiver' },      // Ashton 316 Rd 8 → Hooligans waiver → traded To Infinity

  // Stiff Arm That Njigba
  { player: 'Jalen Tolbert', team: 'Stiff Arm That Njigba', type: 'waiver' },
  { player: 'Isaiah Bond', team: 'Stiff Arm That Njigba', type: 'fa' },
  { player: 'Tyrone Tracy Jr.', team: 'Stiff Arm That Njigba', type: 'waiver' },  // Rents Due Rd 7 → waiver add
  { player: 'DeMario Douglas', team: 'Stiff Arm That Njigba', type: 'waiver' },   // Rents Due Rd 12 → waiver add
  { player: 'Devin Neal', team: 'Stiff Arm That Njigba', type: 'waiver' },
  { player: 'Dylan Sampson', team: 'Stiff Arm That Njigba', type: 'fa' },         // Nacua Rd 13 → FA add
  { player: 'Quinn Ewers', team: 'Stiff Arm That Njigba', type: 'fa' },

  // Hooligans
  { player: 'Woody Marks', team: 'Hooligans', type: 'waiver' },
  { player: 'Spencer Rattler', team: 'Hooligans', type: 'waiver' },
  { player: 'Evan Engram', team: 'Hooligans', type: 'fa' },                       // LaPorta Rd 10 → FA add
  { player: 'T.J. Hockenson', team: 'Hooligans', type: 'waiver' },               // Buck You Rd 8 → waiver add
  { player: 'Sean Tucker', team: 'Hooligans', type: 'fa' },
  { player: 'Tony Pollard', team: 'Hooligans', type: 'waiver' },                  // bichote Rd 5 → waiver add
  { player: 'Cooper Kupp', team: 'Hooligans', type: 'waiver' },                   // Nacua Rd 9 → waiver add
  { player: 'Andrei Iosivas', team: 'Hooligans', type: 'fa' },
  { player: 'Shedeur Sanders', team: 'Hooligans', type: 'fa' },                   // Rents Due Rd 16 → FA add (most recent pickup)
  { player: 'Jordan Mason', team: 'Hooligans', type: 'waiver' },                  // To Infinity Rd 8 → waiver add
  { player: 'Tyreek Hill', team: 'Hooligans', type: 'waiver' },                   // Manifested It Rd 3 → waiver add
  { player: 'Isiah Pacheco', team: 'Hooligans', type: 'waiver' },                 // Stiff Arm Rd 4 → waiver add

  // bichote
  { player: 'Cam Ward', team: 'bichote', type: 'waiver' },                        // Killer Instinct Rd 7 → waiver add
  { player: 'Kendre Miller', team: 'bichote', type: 'waiver' },
  { player: 'Kendrick Bourne', team: 'bichote', type: 'waiver' },
  { player: 'Rico Dowdle', team: 'bichote', type: 'waiver' },                     // Hooligans Rd 15 → waiver add
  { player: 'Darren Waller', team: 'bichote', type: 'waiver' },                   // Manifested It waiver → bichote waiver add
  { player: 'Mack Hollins', team: 'bichote', type: 'waiver' },
  { player: 'Bryce Young', team: 'bichote', type: 'waiver' },                     // Killer Instinct Rd 5 → waiver add
  { player: 'Max Brosmer', team: 'bichote', type: 'waiver' },
  { player: 'Brenton Strange', team: 'bichote', type: 'waiver' },
  { player: 'Colston Loveland', team: 'bichote', type: 'fa' },                    // Nacua Rd 12 → KI waiver → bichote FA add (most recent)
  { player: 'Jalen Coker', team: 'bichote', type: 'fa' },                         // To Infinity Rd 17 → FA add
  { player: 'Jawhar Jordan', team: 'bichote', type: 'waiver' },
  { player: 'Michael Carter', team: 'bichote', type: 'waiver' },

  // Rents Due
  { player: 'Will Shipley', team: 'Rents Due', type: 'waiver' },
  { player: 'Tyrod Taylor', team: 'Rents Due', type: 'waiver' },
  { player: 'Jalen Royals', team: 'Rents Due', type: 'fa' },
  { player: 'Dalton Kincaid', team: 'Rents Due', type: 'fa' },                    // bichote Rd 14 → FA add
  { player: 'Ryan Flournoy', team: 'Rents Due', type: 'fa' },

  // Straight Outta Hampton
  { player: 'Carson Wentz', team: 'Straight Outta Hampton', type: 'waiver' },
  { player: "Wan'Dale Robinson", team: 'Straight Outta Hampton', type: 'waiver' }, // Manifested It Rd 16 → waiver add
  { player: 'Cam Skattebo', team: 'Straight Outta Hampton', type: 'waiver' },
  { player: 'Olamide Zaccheaus', team: 'Straight Outta Hampton', type: 'waiver' },
  { player: 'Darius Slayton', team: 'Straight Outta Hampton', type: 'fa' },
  { player: 'Christian Watson', team: 'Straight Outta Hampton', type: 'waiver' },
  { player: 'Brashard Smith', team: 'Straight Outta Hampton', type: 'fa' },
  { player: 'Kayshon Boutte', team: 'Straight Outta Hampton', type: 'waiver' },   // Stiff Arm waiver → traded to Straight Outta Hampton
  { player: 'Kimani Vidal', team: 'Straight Outta Hampton', type: 'waiver' },     // KI waiver → traded to Straight Outta Hampton
  { player: 'Tyjae Spears', team: 'Straight Outta Hampton', type: 'waiver' },     // KI Rd 13 → re-added waiver → traded to Straight Outta Hampton
  { player: 'Isaiah Davis', team: 'Straight Outta Hampton', type: 'fa' },
  { player: 'Devaughn Vele', team: 'Straight Outta Hampton', type: 'fa' },
  { player: 'Tyler Shough', team: 'Straight Outta Hampton', type: 'waiver' },

  // Buck You
  { player: 'Calvin Ridley', team: 'Buck You', type: 'waiver' },                  // Straight Outta Hampton Rd 5 → waiver add
  { player: 'KaVontae Turpin', team: 'Buck You', type: 'fa' },
  { player: 'Tre Tucker', team: 'Buck You', type: 'waiver' },
  { player: 'Romeo Doubs', team: 'Buck You', type: 'fa' },
  { player: 'Mason Taylor', team: 'Buck You', type: 'fa' },
  { player: 'Theo Johnson', team: 'Buck You', type: 'waiver' },

  // Nacua Matata
  { player: 'Jaylen Wright', team: 'Nacua Matata', type: 'waiver' },
  { player: 'Colby Parkinson', team: 'Nacua Matata', type: 'waiver' },
  { player: 'Chris Rodriguez Jr.', team: 'Nacua Matata', type: 'fa' },
  { player: 'Tank Bigsby', team: 'Nacua Matata', type: 'fa' },                    // Rents Due Rd 10 → FA add
  { player: 'Isaiah Likely', team: 'Nacua Matata', type: 'fa' },                  // bichote Rd 17 → FA add (most recent pickup)
  { player: 'Chimere Dike', team: 'Nacua Matata', type: 'waiver' },               // LaPorta waiver → traded to Nacua
  { player: 'Jake Tonges', team: 'Nacua Matata', type: 'fa' },
  { player: "D'Ernest Johnson", team: 'Nacua Matata', type: 'fa' },

  // Killer Instinct
  { player: 'Najee Harris', team: 'Killer Instinct', type: 'waiver' },
  { player: 'Quentin Johnston', team: 'Killer Instinct', type: 'fa' },
  { player: 'Chig Okonkwo', team: 'Killer Instinct', type: 'waiver' },
  { player: 'RJ Harvey', team: 'Killer Instinct', type: 'waiver' },               // LaPorta Rd 6 → waiver add
  { player: 'David Njoku', team: 'Killer Instinct', type: 'fa' },                 // Manifested It Rd 10 → FA add

  // Ashton 316
  { player: 'Rashid Shaheed', team: 'Ashton 316', type: 'waiver' },
  { player: 'Harold Fannin Jr.', team: 'Ashton 316', type: 'waiver' },
  { player: 'Jake Browning', team: 'Ashton 316', type: 'waiver' },
  { player: 'Oronde Gadsden', team: 'Ashton 316', type: 'waiver' },
  { player: 'Troy Franklin', team: 'Ashton 316', type: 'fa' },                    // Killer Instinct Rd 14 → FA add
  { player: 'Dyami Brown', team: 'Ashton 316', type: 'fa' },
  { player: 'Kenny Gainwell', team: 'Ashton 316', type: 'waiver' },
  { player: 'Michael Wilson', team: 'Ashton 316', type: 'fa' },
  { player: 'Jordan Addison', team: 'Ashton 316', type: 'waiver' },               // bichote Rd 11 → waiver add

  // LaPorta Potty
  { player: 'Calvin Austin III', team: 'LaPorta Potty', type: 'waiver' },
  { player: 'Zach Ertz', team: 'LaPorta Potty', type: 'waiver' },
  { player: 'Hunter Henry', team: 'LaPorta Potty', type: 'waiver' },              // Manifested It Rd 16 → waiver add
  { player: 'Tory Horton', team: 'LaPorta Potty', type: 'waiver' },
  { player: 'Kameron Johnson', team: 'LaPorta Potty', type: 'waiver' },
  { player: 'Kyle Monangai', team: 'LaPorta Potty', type: 'waiver' },
  { player: 'Keon Coleman', team: 'LaPorta Potty', type: 'waiver' },              // Nacua Rd 9 → waiver add
  { player: 'Devin Singletary', team: 'LaPorta Potty', type: 'waiver' },
  { player: 'Bam Knight', team: 'LaPorta Potty', type: 'waiver' },
  { player: 'Elic Ayomanor', team: 'LaPorta Potty', type: 'fa' },
  { player: 'Greg Dortch', team: 'LaPorta Potty', type: 'fa' },
  { player: 'John Metchie III', team: 'LaPorta Potty', type: 'fa' },
  { player: 'Chris Godwin Jr.', team: 'LaPorta Potty', type: 'fa' },             // Ashton 316 Rd 11 → FA add
  { player: 'Ollie Gordon II', team: 'LaPorta Potty', type: 'fa' },              // Nacua FA → traded to LaPorta
  { player: 'Cade Otton', team: 'LaPorta Potty', type: 'waiver' },               // bichote waiver → traded to LaPorta

  // Manifested It
  { player: 'Sterling Shepard', team: 'Manifested It', type: 'waiver' },
  { player: 'Hassan Haskins', team: 'Manifested It', type: 'waiver' },
  { player: 'Luke McCaffrey', team: 'Manifested It', type: 'waiver' },
  { player: 'Xavier Legette', team: 'Manifested It', type: 'waiver' },
  { player: 'Parker Washington', team: 'Manifested It', type: 'fa' },
  { player: 'Darnell Mooney', team: 'Manifested It', type: 'waiver' },            // Ashton 316 Rd 9 → waiver add
  { player: 'Adonai Mitchell', team: 'Manifested It', type: 'waiver' },
  { player: 'Mason Rudolph', team: 'Manifested It', type: 'fa' },
  { player: 'Rhamondre Stevenson', team: 'Manifested It', type: 'waiver' },       // bichote Rd 10 → SOH waiver → traded to Manifested It
];

// Calculate 2026 keeper price from 2025 acquisition
function calcKeeperInfo(player, acquisitionType, data) {
  if (acquisitionType === 'previous_keeper') {
    const nextYear = data.year + 1;
    const nextRound = data.round - 2;
    if (nextYear > 3) return { keepable: false, reason: 'Max 3 years reached', year: nextYear, round: nextRound };
    if (nextRound < 1) return { keepable: false, reason: 'Would require pick earlier than Rd 1', year: nextYear, round: null };
    return { keepable: true, year: nextYear, round: nextRound };
  }
  if (acquisitionType === 'drafted') {
    return { keepable: true, year: 1, round: data.round };
  }
  if (acquisitionType === 'waiver_fa') {
    return { keepable: true, year: 1, round: 8 };
  }
  return { keepable: false, reason: 'Unknown', year: null, round: null };
}

const YEAR_COLORS = { 1: '#4caf50', 2: '#c8a832', 3: '#D64040' };
const YEAR_BG = { 1: '#1a2e1a', 2: '#2e2a0e', 3: '#2a1414' };

function RoundBadge({ round }) {
  return (
    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: 'var(--text)', lineHeight: 1 }}>
      Rd {round}
    </span>
  );
}

function YearPill({ year, keepable }) {
  if (!keepable) return <span style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>—</span>;
  const color = YEAR_COLORS[year] || '#888';
  const bg = YEAR_BG[year] || '#222';
  const label = year === 3 ? 'Yr 3 · Last year' : `Yr ${year}`;
  return (
    <span style={{ fontSize: 9, color, background: bg, borderRadius: 3, padding: '2px 6px', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function PlayerRow({ player, acquisitionType, acqLabel, keepInfo, warn }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 10px',
      borderTop: '0.5px solid #1e1e1e',
      opacity: keepInfo.keepable ? 1 : 0.45,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: keepInfo.keepable ? 'var(--text)' : '#555', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player}
          {!keepInfo.keepable && (
            <span style={{ fontSize: 9, color: '#D64040', marginLeft: 6 }}>✕ {keepInfo.reason}</span>
          )}
        </div>
        <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{acqLabel}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {keepInfo.keepable ? <RoundBadge round={keepInfo.round} /> : <span style={{ fontSize: 12, color: '#333' }}>—</span>}
        <YearPill year={keepInfo.year} keepable={keepInfo.keepable} />
      </div>
    </div>
  );
}

function TeamSection({ team }) {
  const owner = TEAM_OWNERS[team];

  const previousKeepers = KEEPERS_FOR_2025.filter(k => k.team === team).map(k => {
    const keepInfo = calcKeeperInfo(k.player, 'previous_keeper', k);
    return { ...k, keepInfo, acqLabel: `Kept 2025 · Yr ${k.year} · Rd ${k.round}` };
  });

  const freshPicks = DRAFT_2025
    .filter(d => d.team === team && !KEEPER_NAMES_2025.has(d.player))
    .map(d => {
      const keepInfo = calcKeeperInfo(d.player, 'drafted', d);
      return { ...d, keepInfo, acqLabel: `Drafted 2025 · Rd ${d.round}` };
    });

  const waiverAdds = WAIVER_FA_2025.filter(w => w.team === team).map(w => {
    const keepInfo = calcKeeperInfo(w.player, 'waiver_fa', w);
    return { ...w, keepInfo, acqLabel: w.type === 'waiver' ? 'Waiver add 2025' : 'FA add 2025' };
  });

  const SectionHeader = ({ label, count }) => (
    <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', padding: '8px 10px 4px', borderTop: '0.5px solid var(--border)', marginTop: 4 }}>
      {label} <span style={{ color: '#333' }}>({count})</span>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{team}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{owner}</div>
      </div>

      {previousKeepers.length > 0 && (
        <>
          <SectionHeader label="Previous keepers" count={previousKeepers.length} />
          {previousKeepers.map((k, i) => (
            <PlayerRow key={i} player={k.player} acquisitionType="previous_keeper" acqLabel={k.acqLabel} keepInfo={k.keepInfo} />
          ))}
        </>
      )}

      <SectionHeader label="2025 draft picks" count={freshPicks.length} />
      {freshPicks.sort((a, b) => a.round - b.round).map((p, i) => (
        <PlayerRow key={i} player={p.player} acquisitionType="drafted" acqLabel={p.acqLabel} keepInfo={p.keepInfo} />
      ))}

      {waiverAdds.length > 0 && (
        <>
          <SectionHeader label="Waiver / FA adds" count={waiverAdds.length} />
          {waiverAdds.map((w, i) => (
            <PlayerRow key={i} player={w.player} acquisitionType="waiver_fa" acqLabel={w.acqLabel} keepInfo={w.keepInfo} />
          ))}
        </>
      )}
    </div>
  );
}

export default function KeeperPriceCalc() {
  const [view, setView] = useState('search');
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [query, setQuery] = useState('');

  // Build unified player index for search
  const allPlayers = useMemo(() => {
    const results = [];

    KEEPERS_FOR_2025.forEach(k => {
      const keepInfo = calcKeeperInfo(k.player, 'previous_keeper', k);
      results.push({ player: k.player, team: k.team, acqLabel: `Kept 2025 · Yr ${k.year} · Rd ${k.round}`, keepInfo });
    });

    DRAFT_2025.filter(d => !KEEPER_NAMES_2025.has(d.player)).forEach(d => {
      const keepInfo = calcKeeperInfo(d.player, 'drafted', d);
      results.push({ player: d.player, team: d.team, acqLabel: `Drafted 2025 · Rd ${d.round}`, keepInfo });
    });

    WAIVER_FA_2025.forEach(w => {
      const keepInfo = calcKeeperInfo(w.player, 'waiver_fa', w);
      results.push({ player: w.player, team: w.team, acqLabel: w.type === 'waiver' ? 'Waiver add 2025' : 'FA add 2025', keepInfo });
    });

    return results;
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allPlayers.filter(p => p.player.toLowerCase().includes(q)).slice(0, 20);
  }, [query, allPlayers]);

  return (
    <div style={styles.wrap}>
      <div style={styles.info}>
        2026 keeper prices based on 2025 acquisitions. Drafted players keep at their draft round (Yr 1). Waiver/FA adds = Rd 8 (Yr 1). Each subsequent year kept costs 2 rounds earlier. Max 3 years. Note: if a player changed teams via trade during 2025, their price reflects the original 2025 acquisition.
      </div>

      <div style={styles.legend}>
        {[['Yr 1', '#4caf50', '#1a2e1a'], ['Yr 2', '#c8a832', '#2e2a0e'], ['Yr 3 (last)', '#D64040', '#2a1414']].map(([label, color, bg]) => (
          <span key={label} style={{ fontSize: 10, color, background: bg, borderRadius: 3, padding: '3px 8px', letterSpacing: '0.04em' }}>{label}</span>
        ))}
      </div>

      <div style={styles.viewToggle}>
        <button onClick={() => setView('search')} style={{ ...styles.toggleBtn, ...(view === 'search' ? styles.toggleActive : {}) }}>
          Search Player
        </button>
        <button onClick={() => setView('team')} style={{ ...styles.toggleBtn, ...(view === 'team' ? styles.toggleActive : {}) }}>
          By Team
        </button>
      </div>

      {view === 'search' && (
        <div>
          <input
            type="text"
            placeholder="Search any player…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={styles.searchInput}
            autoFocus
          />
          {query && filtered.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '20px 0' }}>No results for "{query}"</div>
          )}
          {filtered.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
              {filtered.map((p, i) => (
                <div key={i} style={{ ...styles.searchRow, opacity: p.keepInfo.keepable ? 1 : 0.45, borderTop: i === 0 ? 'none' : '0.5px solid #1e1e1e' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>{p.player}</span>
                      {!p.keepInfo.keepable && (
                        <span style={{ fontSize: 9, color: '#D64040' }}>✕ {p.keepInfo.reason}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                      {p.team} · {TEAM_OWNERS[p.team]} · {p.acqLabel}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {p.keepInfo.keepable
                      ? <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--text)' }}>Rd {p.keepInfo.round}</span>
                      : <span style={{ fontSize: 14, color: '#333' }}>—</span>
                    }
                    <YearPill year={p.keepInfo.year} keepable={p.keepInfo.keepable} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!query && (
            <div style={{ fontSize: 12, color: '#444', padding: '32px 0', textAlign: 'center' }}>
              Type a player's name to look up their 2026 keeper price
            </div>
          )}
        </div>
      )}

      {view === 'team' && (
        <div>
          <div style={styles.teamTabs}>
            {TEAMS.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTeam(t)}
                style={{ ...styles.teamTab, ...(selectedTeam === t ? styles.teamTabActive : {}) }}
              >
                <span style={{ display: 'block', fontSize: 11 }}>{t}</span>
                <span style={{ display: 'block', fontSize: 9, color: selectedTeam === t ? 'var(--red-dim)' : '#444' }}>{TEAM_OWNERS[t]}</span>
              </button>
            ))}
          </div>
          <TeamSection team={selectedTeam} />
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  info: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' },
  legend: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  viewToggle: { display: 'flex', gap: 4 },
  toggleBtn: { padding: '7px 14px', fontSize: 12, background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' },
  toggleActive: { background: 'var(--red)', color: '#fff', borderColor: 'var(--red)' },
  searchInput: { width: '100%', padding: '10px 14px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' },
  searchRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' },
  teamTabs: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  teamTab: { padding: '7px 12px', fontSize: 11, background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left' },
  teamTabActive: { borderColor: 'var(--red)', color: 'var(--text)', background: '#1a1616' },
};
