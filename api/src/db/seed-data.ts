// Ratings are approximate audience scores for the demo, not quoted from any source.
export interface SeedMovie {
  title: string
  released: number
  runtime: number
  rating: number
  genres: string[]
  directors: string[]
  writers?: string[]
  cast: [name: string, character: string][]
}

export const seedPeople: Record<string, number | null> = {
  'Christopher Nolan': 1970,
  'Christian Bale': 1974,
  'Michael Caine': 1933,
  'Cillian Murphy': 1976,
  'Tom Hardy': 1977,
  'Hugh Jackman': 1968,
  'Scarlett Johansson': 1984,
  'Matthew McConaughey': 1969,
  'Anne Hathaway': 1982,
  'Leonardo DiCaprio': 1974,
  'Joseph Gordon-Levitt': 1981,
  'Elliot Page': 1987,
  'Heath Ledger': 1979,
  'Gary Oldman': 1958,
  'Emily Blunt': 1983,
  'Matt Damon': 1970,
  'Robert Downey Jr.': 1965,
  'Florence Pugh': 1996,
  'Guy Pearce': 1967,
  'Carrie-Anne Moss': 1967,
  'Joe Pantoliano': 1951,
  'Liam Neeson': 1952,
  'Katie Holmes': 1978,
  'Morgan Freeman': 1937,
  'Marion Cotillard': 1975,
  'Ken Watanabe': 1959,
  'Jessica Chastain': 1977,
  'Casey Affleck': 1975,
  'Fionn Whitehead': 1997,
  'Kenneth Branagh': 1960,
  'Harry Styles': 1994,
  'Lana Wachowski': 1965,
  'Lilly Wachowski': 1967,
  'Keanu Reeves': 1964,
  'Laurence Fishburne': 1961,
  'Hugo Weaving': 1960,
  'Chad Stahelski': 1968,
  'Willem Dafoe': 1955,
  'Jan de Bont': 1943,
  'Sandra Bullock': 1964,
  'Dennis Hopper': 1936,
  'Alfonso Cuarón': 1961,
  'George Clooney': 1961,
  'Clive Owen': 1964,
  'Julianne Moore': 1960,
  'Steven Soderbergh': 1963,
  'Brad Pitt': 1963,
  'Julia Roberts': 1967,
  'David Fincher': 1962,
  'Gwyneth Paltrow': 1972,
  'Edward Norton': 1969,
  'Helena Bonham Carter': 1966,
  'Jesse Eisenberg': 1983,
  'Andrew Garfield': 1983,
  'Justin Timberlake': 1981,
  'Ben Affleck': 1972,
  'Rosamund Pike': 1979,
  'Martin Scorsese': 1942,
  'Jack Nicholson': 1937,
  'Mark Wahlberg': 1971,
  'Mark Ruffalo': 1967,
  'Ben Kingsley': 1943,
  'Jonah Hill': 1983,
  'Margot Robbie': 1990,
  'Quentin Tarantino': 1963,
  'John Travolta': 1954,
  'Samuel L. Jackson': 1948,
  'Uma Thurman': 1970,
  'Bruce Willis': 1955,
  'Christoph Waltz': 1956,
  'Mélanie Laurent': 1983,
  'Michael Fassbender': 1977,
  'Jamie Foxx': 1967,
  'George Miller': 1945,
  'Charlize Theron': 1975,
  'Nicholas Hoult': 1989,
  'Doug Liman': 1965,
  'Tom Cruise': 1962,
  'Denis Villeneuve': 1967,
  'Benicio del Toro': 1967,
  'Josh Brolin': 1968,
  'Amy Adams': 1974,
  'Jeremy Renner': 1971,
  'Forest Whitaker': 1961,
  'Ryan Gosling': 1980,
  'Harrison Ford': 1942,
  'Ana de Armas': 1988,
  'Timothée Chalamet': 1995,
  'Rebecca Ferguson': 1983,
  'Oscar Isaac': 1979,
  'Zendaya': 1996,
  'Jason Momoa': 1979,
  'Austin Butler': 1991,
  'Damien Chazelle': 1985,
  'Emma Stone': 1988,
  'J.K. Simmons': 1955,
  'Miles Teller': 1987,
  'Nicolas Winding Refn': 1970,
  'Carey Mulligan': 1985,
  'Rian Johnson': 1973,
  'Daniel Craig': 1968,
  'Chris Evans': 1981,
  'Jamie Lee Curtis': 1958,
  'Cary Joji Fukunaga': 1977,
  'Rami Malek': 1981,
  'Léa Seydoux': 1985,
  'Daniel Kwan': 1988,
  'Daniel Scheinert': 1987,
  'Michelle Yeoh': 1962,
  'Ke Huy Quan': 1971,
  'Stephanie Hsu': 1990,
  'Bong Joon-ho': 1969,
  'Song Kang-ho': 1967,
  'Choi Woo-shik': 1990,
  'Park So-dam': 1991,
  'Cho Yeo-jeong': 1981,
  'Tilda Swinton': 1960,
  'Wes Anderson': 1969,
  'Ralph Fiennes': 1962,
  'Tony Revolori': 1996,
  'Saoirse Ronan': 1994,
  'Adrien Brody': 1973,
  'Greta Gerwig': 1983,
  'Laurie Metcalf': 1955,
  'Emma Watson': 1990,
  'Laura Dern': 1967,
  'Meryl Streep': 1949,
  'America Ferrera': 1984,
  'Jordan Peele': 1979,
  'Daniel Kaluuya': 1989,
  'Allison Williams': 1988,
}

const nolan = ['Christopher Nolan']
const tarantino = ['Quentin Tarantino']
const fincher = ['David Fincher']
const scorsese = ['Martin Scorsese']
const villeneuve = ['Denis Villeneuve']
const gerwig = ['Greta Gerwig']

export const seedMovies: SeedMovie[] = [
  {
    title: 'Memento', released: 2000, runtime: 113, rating: 8.4, genres: ['Mystery', 'Thriller'],
    directors: nolan, writers: nolan,
    cast: [['Guy Pearce', 'Leonard Shelby'], ['Carrie-Anne Moss', 'Natalie'], ['Joe Pantoliano', 'Teddy']],
  },
  {
    title: 'Batman Begins', released: 2005, runtime: 140, rating: 8.2, genres: ['Action', 'Crime', 'Drama'],
    directors: nolan,
    cast: [
      ['Christian Bale', 'Bruce Wayne'], ['Michael Caine', 'Alfred'], ['Liam Neeson', 'Ducard'],
      ['Gary Oldman', 'Jim Gordon'], ['Cillian Murphy', 'Dr. Jonathan Crane'], ['Katie Holmes', 'Rachel Dawes'],
      ['Morgan Freeman', 'Lucius Fox'],
    ],
  },
  {
    title: 'The Prestige', released: 2006, runtime: 130, rating: 8.5, genres: ['Drama', 'Mystery', 'Sci-Fi'],
    directors: nolan, writers: nolan,
    cast: [
      ['Hugh Jackman', 'Robert Angier'], ['Christian Bale', 'Alfred Borden'], ['Michael Caine', 'Cutter'],
      ['Scarlett Johansson', 'Olivia Wenscombe'],
    ],
  },
  {
    title: 'The Dark Knight', released: 2008, runtime: 152, rating: 9.0, genres: ['Action', 'Crime', 'Drama'],
    directors: nolan, writers: nolan,
    cast: [
      ['Christian Bale', 'Bruce Wayne'], ['Heath Ledger', 'Joker'], ['Gary Oldman', 'Jim Gordon'],
      ['Michael Caine', 'Alfred'], ['Morgan Freeman', 'Lucius Fox'],
    ],
  },
  {
    title: 'Inception', released: 2010, runtime: 148, rating: 8.8, genres: ['Action', 'Sci-Fi', 'Thriller'],
    directors: nolan, writers: nolan,
    cast: [
      ['Leonardo DiCaprio', 'Cobb'], ['Joseph Gordon-Levitt', 'Arthur'], ['Elliot Page', 'Ariadne'],
      ['Tom Hardy', 'Eames'], ['Cillian Murphy', 'Robert Fischer'], ['Marion Cotillard', 'Mal'],
      ['Ken Watanabe', 'Saito'], ['Michael Caine', 'Miles'],
    ],
  },
  {
    title: 'The Dark Knight Rises', released: 2012, runtime: 164, rating: 8.4, genres: ['Action', 'Crime', 'Drama'],
    directors: nolan, writers: nolan,
    cast: [
      ['Christian Bale', 'Bruce Wayne'], ['Tom Hardy', 'Bane'], ['Anne Hathaway', 'Selina Kyle'],
      ['Joseph Gordon-Levitt', 'John Blake'], ['Marion Cotillard', 'Miranda Tate'], ['Gary Oldman', 'Jim Gordon'],
      ['Michael Caine', 'Alfred'], ['Morgan Freeman', 'Lucius Fox'],
    ],
  },
  {
    title: 'Interstellar', released: 2014, runtime: 169, rating: 8.7, genres: ['Adventure', 'Drama', 'Sci-Fi'],
    directors: nolan, writers: nolan,
    cast: [
      ['Matthew McConaughey', 'Cooper'], ['Anne Hathaway', 'Brand'], ['Jessica Chastain', 'Murph'],
      ['Michael Caine', 'Professor Brand'], ['Matt Damon', 'Dr. Mann'], ['Casey Affleck', 'Tom'],
    ],
  },
  {
    title: 'Dunkirk', released: 2017, runtime: 106, rating: 7.8, genres: ['Action', 'Drama', 'History', 'War'],
    directors: nolan, writers: nolan,
    cast: [
      ['Fionn Whitehead', 'Tommy'], ['Tom Hardy', 'Farrier'], ['Cillian Murphy', 'Shivering Soldier'],
      ['Kenneth Branagh', 'Commander Bolton'], ['Harry Styles', 'Alex'],
    ],
  },
  {
    title: 'Oppenheimer', released: 2023, runtime: 180, rating: 8.3, genres: ['Biography', 'Drama', 'History'],
    directors: nolan, writers: nolan,
    cast: [
      ['Cillian Murphy', 'J. Robert Oppenheimer'], ['Emily Blunt', 'Kitty Oppenheimer'], ['Matt Damon', 'Leslie Groves'],
      ['Robert Downey Jr.', 'Lewis Strauss'], ['Florence Pugh', 'Jean Tatlock'], ['Kenneth Branagh', 'Niels Bohr'],
    ],
  },
  {
    title: 'The Matrix', released: 1999, runtime: 136, rating: 8.7, genres: ['Action', 'Sci-Fi'],
    directors: ['Lana Wachowski', 'Lilly Wachowski'], writers: ['Lana Wachowski', 'Lilly Wachowski'],
    cast: [
      ['Keanu Reeves', 'Neo'], ['Laurence Fishburne', 'Morpheus'], ['Carrie-Anne Moss', 'Trinity'],
      ['Hugo Weaving', 'Agent Smith'],
    ],
  },
  {
    title: 'John Wick', released: 2014, runtime: 101, rating: 7.4, genres: ['Action', 'Thriller'],
    directors: ['Chad Stahelski'],
    cast: [['Keanu Reeves', 'John Wick'], ['Willem Dafoe', 'Marcus']],
  },
  {
    title: 'Speed', released: 1994, runtime: 116, rating: 7.3, genres: ['Action', 'Thriller'],
    directors: ['Jan de Bont'],
    cast: [['Keanu Reeves', 'Jack Traven'], ['Sandra Bullock', 'Annie'], ['Dennis Hopper', 'Howard Payne']],
  },
  {
    title: 'Gravity', released: 2013, runtime: 91, rating: 7.7, genres: ['Drama', 'Sci-Fi', 'Thriller'],
    directors: ['Alfonso Cuarón'],
    cast: [['Sandra Bullock', 'Ryan Stone'], ['George Clooney', 'Matt Kowalski']],
  },
  {
    title: 'Children of Men', released: 2006, runtime: 109, rating: 7.9, genres: ['Drama', 'Sci-Fi', 'Thriller'],
    directors: ['Alfonso Cuarón'],
    cast: [['Clive Owen', 'Theo'], ['Julianne Moore', 'Julian'], ['Michael Caine', 'Jasper']],
  },
  {
    title: "Ocean's Eleven", released: 2001, runtime: 116, rating: 7.7, genres: ['Crime', 'Thriller'],
    directors: ['Steven Soderbergh'],
    cast: [
      ['George Clooney', 'Danny Ocean'], ['Brad Pitt', 'Rusty Ryan'], ['Matt Damon', 'Linus Caldwell'],
      ['Julia Roberts', 'Tess Ocean'],
    ],
  },
  {
    title: 'Se7en', released: 1995, runtime: 127, rating: 8.6, genres: ['Crime', 'Drama', 'Mystery'],
    directors: fincher,
    cast: [['Brad Pitt', 'Mills'], ['Morgan Freeman', 'Somerset'], ['Gwyneth Paltrow', 'Tracy']],
  },
  {
    title: 'Fight Club', released: 1999, runtime: 139, rating: 8.8, genres: ['Drama'],
    directors: fincher,
    cast: [['Brad Pitt', 'Tyler Durden'], ['Edward Norton', 'The Narrator'], ['Helena Bonham Carter', 'Marla Singer']],
  },
  {
    title: 'The Social Network', released: 2010, runtime: 120, rating: 7.8, genres: ['Biography', 'Drama'],
    directors: fincher,
    cast: [
      ['Jesse Eisenberg', 'Mark Zuckerberg'], ['Andrew Garfield', 'Eduardo Saverin'], ['Justin Timberlake', 'Sean Parker'],
    ],
  },
  {
    title: 'Gone Girl', released: 2014, runtime: 149, rating: 8.1, genres: ['Drama', 'Mystery', 'Thriller'],
    directors: fincher,
    cast: [['Ben Affleck', 'Nick Dunne'], ['Rosamund Pike', 'Amy Dunne']],
  },
  {
    title: 'The Departed', released: 2006, runtime: 151, rating: 8.5, genres: ['Crime', 'Drama', 'Thriller'],
    directors: scorsese,
    cast: [
      ['Leonardo DiCaprio', 'Billy Costigan'], ['Matt Damon', 'Colin Sullivan'], ['Jack Nicholson', 'Frank Costello'],
      ['Mark Wahlberg', 'Dignam'],
    ],
  },
  {
    title: 'Shutter Island', released: 2010, runtime: 138, rating: 8.2, genres: ['Mystery', 'Thriller'],
    directors: scorsese,
    cast: [['Leonardo DiCaprio', 'Teddy Daniels'], ['Mark Ruffalo', 'Chuck Aule'], ['Ben Kingsley', 'Dr. Cawley']],
  },
  {
    title: 'The Wolf of Wall Street', released: 2013, runtime: 180, rating: 8.2, genres: ['Biography', 'Comedy', 'Crime'],
    directors: scorsese,
    cast: [
      ['Leonardo DiCaprio', 'Jordan Belfort'], ['Jonah Hill', 'Donnie Azoff'], ['Margot Robbie', 'Naomi Lapaglia'],
      ['Matthew McConaughey', 'Mark Hanna'],
    ],
  },
  {
    title: 'Pulp Fiction', released: 1994, runtime: 154, rating: 8.9, genres: ['Crime', 'Drama'],
    directors: tarantino, writers: tarantino,
    cast: [
      ['John Travolta', 'Vincent Vega'], ['Samuel L. Jackson', 'Jules Winnfield'], ['Uma Thurman', 'Mia Wallace'],
      ['Bruce Willis', 'Butch Coolidge'], ['Quentin Tarantino', 'Jimmie'],
    ],
  },
  {
    title: 'Inglourious Basterds', released: 2009, runtime: 153, rating: 8.4, genres: ['Adventure', 'Drama', 'War'],
    directors: tarantino, writers: tarantino,
    cast: [
      ['Brad Pitt', 'Aldo Raine'], ['Christoph Waltz', 'Hans Landa'], ['Mélanie Laurent', 'Shosanna'],
      ['Michael Fassbender', 'Archie Hicox'],
    ],
  },
  {
    title: 'Django Unchained', released: 2012, runtime: 165, rating: 8.5, genres: ['Drama', 'Western'],
    directors: tarantino, writers: tarantino,
    cast: [
      ['Jamie Foxx', 'Django'], ['Christoph Waltz', 'Dr. King Schultz'], ['Leonardo DiCaprio', 'Calvin Candie'],
      ['Samuel L. Jackson', 'Stephen'],
    ],
  },
  {
    title: 'Once Upon a Time in Hollywood', released: 2019, runtime: 161, rating: 7.6, genres: ['Comedy', 'Drama'],
    directors: tarantino, writers: tarantino,
    cast: [['Leonardo DiCaprio', 'Rick Dalton'], ['Brad Pitt', 'Cliff Booth'], ['Margot Robbie', 'Sharon Tate']],
  },
  {
    title: 'Mad Max: Fury Road', released: 2015, runtime: 120, rating: 8.1, genres: ['Action', 'Adventure', 'Sci-Fi'],
    directors: ['George Miller'],
    cast: [['Tom Hardy', 'Max'], ['Charlize Theron', 'Furiosa'], ['Nicholas Hoult', 'Nux']],
  },
  {
    title: 'Edge of Tomorrow', released: 2014, runtime: 113, rating: 7.9, genres: ['Action', 'Sci-Fi'],
    directors: ['Doug Liman'],
    cast: [['Tom Cruise', 'Cage'], ['Emily Blunt', 'Rita Vrataski']],
  },
  {
    title: 'Sicario', released: 2015, runtime: 121, rating: 7.6, genres: ['Action', 'Crime', 'Drama'],
    directors: villeneuve,
    cast: [['Emily Blunt', 'Kate Macer'], ['Benicio del Toro', 'Alejandro'], ['Josh Brolin', 'Matt Graver']],
  },
  {
    title: 'Arrival', released: 2016, runtime: 116, rating: 7.9, genres: ['Drama', 'Mystery', 'Sci-Fi'],
    directors: villeneuve,
    cast: [['Amy Adams', 'Louise Banks'], ['Jeremy Renner', 'Ian Donnelly'], ['Forest Whitaker', 'Colonel Weber']],
  },
  {
    title: 'Blade Runner 2049', released: 2017, runtime: 164, rating: 8.0, genres: ['Action', 'Drama', 'Sci-Fi'],
    directors: villeneuve,
    cast: [['Ryan Gosling', 'K'], ['Harrison Ford', 'Rick Deckard'], ['Ana de Armas', 'Joi']],
  },
  {
    title: 'Dune', released: 2021, runtime: 155, rating: 8.0, genres: ['Adventure', 'Drama', 'Sci-Fi'],
    directors: villeneuve,
    cast: [
      ['Timothée Chalamet', 'Paul Atreides'], ['Rebecca Ferguson', 'Lady Jessica'], ['Oscar Isaac', 'Duke Leto'],
      ['Zendaya', 'Chani'], ['Josh Brolin', 'Gurney Halleck'], ['Jason Momoa', 'Duncan Idaho'],
    ],
  },
  {
    title: 'Dune: Part Two', released: 2024, runtime: 166, rating: 8.5, genres: ['Adventure', 'Drama', 'Sci-Fi'],
    directors: villeneuve,
    cast: [
      ['Timothée Chalamet', 'Paul Atreides'], ['Zendaya', 'Chani'], ['Rebecca Ferguson', 'Lady Jessica'],
      ['Josh Brolin', 'Gurney Halleck'], ['Austin Butler', 'Feyd-Rautha'], ['Florence Pugh', 'Princess Irulan'],
    ],
  },
  {
    title: 'La La Land', released: 2016, runtime: 128, rating: 8.0, genres: ['Comedy', 'Drama', 'Music', 'Romance'],
    directors: ['Damien Chazelle'], writers: ['Damien Chazelle'],
    cast: [['Ryan Gosling', 'Sebastian'], ['Emma Stone', 'Mia'], ['J.K. Simmons', 'Bill']],
  },
  {
    title: 'Whiplash', released: 2014, runtime: 106, rating: 8.5, genres: ['Drama', 'Music'],
    directors: ['Damien Chazelle'], writers: ['Damien Chazelle'],
    cast: [['Miles Teller', 'Andrew Neiman'], ['J.K. Simmons', 'Terence Fletcher']],
  },
  {
    title: 'Drive', released: 2011, runtime: 100, rating: 7.8, genres: ['Crime', 'Drama'],
    directors: ['Nicolas Winding Refn'],
    cast: [['Ryan Gosling', 'Driver'], ['Carey Mulligan', 'Irene']],
  },
  {
    title: 'Knives Out', released: 2019, runtime: 130, rating: 7.9, genres: ['Comedy', 'Crime', 'Mystery'],
    directors: ['Rian Johnson'], writers: ['Rian Johnson'],
    cast: [
      ['Daniel Craig', 'Benoit Blanc'], ['Ana de Armas', 'Marta Cabrera'], ['Chris Evans', 'Ransom Drysdale'],
      ['Jamie Lee Curtis', 'Linda Drysdale'],
    ],
  },
  {
    title: 'No Time to Die', released: 2021, runtime: 163, rating: 7.3, genres: ['Action', 'Adventure', 'Thriller'],
    directors: ['Cary Joji Fukunaga'],
    cast: [
      ['Daniel Craig', 'James Bond'], ['Ana de Armas', 'Paloma'], ['Rami Malek', 'Safin'], ['Léa Seydoux', 'Madeleine Swann'],
    ],
  },
  {
    title: 'Everything Everywhere All at Once', released: 2022, runtime: 139, rating: 7.8,
    genres: ['Action', 'Adventure', 'Comedy'],
    directors: ['Daniel Kwan', 'Daniel Scheinert'], writers: ['Daniel Kwan', 'Daniel Scheinert'],
    cast: [
      ['Michelle Yeoh', 'Evelyn Wang'], ['Ke Huy Quan', 'Waymond Wang'], ['Stephanie Hsu', 'Joy Wang'],
      ['Jamie Lee Curtis', 'Deirdre Beaubeirdre'],
    ],
  },
  {
    title: 'Parasite', released: 2019, runtime: 132, rating: 8.5, genres: ['Drama', 'Thriller'],
    directors: ['Bong Joon-ho'], writers: ['Bong Joon-ho'],
    cast: [
      ['Song Kang-ho', 'Kim Ki-taek'], ['Choi Woo-shik', 'Kim Ki-woo'], ['Park So-dam', 'Kim Ki-jung'],
      ['Cho Yeo-jeong', 'Park Yeon-kyo'],
    ],
  },
  {
    title: 'Snowpiercer', released: 2013, runtime: 126, rating: 7.1, genres: ['Action', 'Drama', 'Sci-Fi'],
    directors: ['Bong Joon-ho'],
    cast: [['Chris Evans', 'Curtis'], ['Song Kang-ho', 'Namgoong Minsu'], ['Tilda Swinton', 'Mason']],
  },
  {
    title: 'The Grand Budapest Hotel', released: 2014, runtime: 99, rating: 8.1, genres: ['Adventure', 'Comedy', 'Crime'],
    directors: ['Wes Anderson'], writers: ['Wes Anderson'],
    cast: [
      ['Ralph Fiennes', 'M. Gustave'], ['Tony Revolori', 'Zero'], ['Saoirse Ronan', 'Agatha'],
      ['Tilda Swinton', 'Madame D.'], ['Adrien Brody', 'Dmitri'], ['Willem Dafoe', 'Jopling'], ['Edward Norton', 'Henckels'],
    ],
  },
  {
    title: 'Lady Bird', released: 2017, runtime: 94, rating: 7.4, genres: ['Comedy', 'Drama'],
    directors: gerwig, writers: gerwig,
    cast: [
      ['Saoirse Ronan', 'Christine "Lady Bird" McPherson'], ['Laurie Metcalf', 'Marion McPherson'],
      ['Timothée Chalamet', 'Kyle'],
    ],
  },
  {
    title: 'Little Women', released: 2019, runtime: 135, rating: 7.8, genres: ['Drama', 'Romance'],
    directors: gerwig, writers: gerwig,
    cast: [
      ['Saoirse Ronan', 'Jo March'], ['Emma Watson', 'Meg March'], ['Florence Pugh', 'Amy March'],
      ['Timothée Chalamet', 'Laurie'], ['Laura Dern', 'Marmee'], ['Meryl Streep', 'Aunt March'],
    ],
  },
  {
    title: 'Barbie', released: 2023, runtime: 114, rating: 6.8, genres: ['Adventure', 'Comedy', 'Fantasy'],
    directors: gerwig, writers: gerwig,
    cast: [['Margot Robbie', 'Barbie'], ['Ryan Gosling', 'Ken'], ['America Ferrera', 'Gloria']],
  },
  {
    title: 'Get Out', released: 2017, runtime: 104, rating: 7.8, genres: ['Horror', 'Mystery', 'Thriller'],
    directors: ['Jordan Peele'], writers: ['Jordan Peele'],
    cast: [['Daniel Kaluuya', 'Chris Washington'], ['Allison Williams', 'Rose Armitage']],
  },
]
