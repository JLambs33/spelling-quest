// reading-data.js — Built-in Minecraft passage library
//
// To add a passage: copy an existing entry, paste at the end of the array, update all fields.
// To edit a passage: find by title, change text or questions in place.
// To remove a passage: delete the entry block.
// No PR or UI needed for pure content changes — a direct commit to main is fine.
//
// Levels:  'k' | 'grade1' | 'grade2' | 'grade3' | 'grade4'
// Types:   'adventure' | 'lore' | 'howto' | 'sightword'
// correct: index into options[] that is the right answer

const READING_LIBRARY = [

  // ── KINDERGARTEN ─────────────────────────────────────────────

  {
    id: 'builtin-k-lore-1',
    level: 'k',
    type: 'lore',
    title: 'The Creeper',
    text: 'A creeper is green. It walks at night. Do not go close. It will blow up. Run away fast!',
    questions: [
      { q: 'What color is a creeper?', options: ['green', 'red', 'blue', 'white'], correct: 0 }
    ]
  },

  {
    id: 'builtin-k-sightword-1',
    level: 'k',
    type: 'sightword',
    title: 'The Big Pig',
    text: 'The pig is big. I see the pig. The pig is pink. I like the pig.',
    questions: [
      { q: 'What color is the pig?', options: ['pink', 'blue', 'green', 'brown'], correct: 0 }
    ]
  },

  {
    id: 'builtin-k-adventure-1',
    level: 'k',
    type: 'adventure',
    title: 'Alex and the Cow',
    text: 'Alex sees a cow. The cow says moo. Alex gives it wheat. The cow is happy.',
    questions: [
      { q: 'What did Alex give the cow?', options: ['wheat', 'a bone', 'seeds', 'carrots'], correct: 0 }
    ]
  },

  {
    id: 'builtin-k-howto-1',
    level: 'k',
    type: 'howto',
    title: 'Making Planks',
    text: 'Put wood in the crafting box. You get planks. Planks make a crafting table. A crafting table helps you make things.',
    questions: [
      { q: 'What do you get from wood?', options: ['planks', 'sticks', 'coal', 'string'], correct: 0 }
    ]
  },

  {
    id: 'builtin-k-adventure-2',
    level: 'k',
    type: 'adventure',
    title: 'Safe at Night',
    text: 'It is night. Mobs come out. Steve runs home. He shuts the door. He is safe now.',
    questions: [
      { q: 'Why does Steve run home?', options: ['mobs come out at night', 'he is hungry', 'it is raining', 'he is tired'], correct: 0 }
    ]
  },

  // ── GRADE 1 ───────────────────────────────────────────────────

  {
    id: 'builtin-1-sightword-1',
    level: 'grade1',
    type: 'sightword',
    title: 'A Day of Digging',
    text: 'I like to dig. I dig with my shovel. I found some dirt and some sand. I also found a little coal.',
    questions: [
      { q: 'What did the speaker use to dig?', options: ['a shovel', 'a pickaxe', 'their hands', 'a hoe'], correct: 0 },
      { q: 'What did they find besides dirt and sand?', options: ['coal', 'iron', 'gold', 'gravel'], correct: 0 }
    ]
  },

  {
    id: 'builtin-1-adventure-1',
    level: 'grade1',
    type: 'adventure',
    title: "Alex's Wooden House",
    text: 'Alex built a house out of wood. She put a door in front. She added windows on each side. Now she was safe from the night.',
    questions: [
      { q: 'What did Alex build?', options: ['a house', 'a farm', 'a boat', 'a fence'], correct: 0 },
      { q: 'Why did Alex build the house?', options: ['to be safe at night', 'to store food', 'to make friends', 'to hide from rain'], correct: 0 }
    ]
  },

  {
    id: 'builtin-1-lore-1',
    level: 'grade1',
    type: 'lore',
    title: 'Sheep and Wool',
    text: 'Sheep live in grassy fields. They make a sound called a bleat. You can shear a sheep to get wool. Wool is used to make beds and banners.',
    questions: [
      { q: 'What sound does a sheep make?', options: ['a bleat', 'a moo', 'a roar', 'a squeak'], correct: 0 },
      { q: 'What do you get when you shear a sheep?', options: ['wool', 'leather', 'feathers', 'meat'], correct: 0 }
    ]
  },

  {
    id: 'builtin-1-howto-1',
    level: 'grade1',
    type: 'howto',
    title: 'How to Make a Torch',
    text: 'To make a torch, you need one stick and one coal. Put the coal above the stick on the crafting table. Torches give off light in dark places.',
    questions: [
      { q: 'What do you need to make a torch?', options: ['a stick and coal', 'wood and iron', 'stone and coal', 'a stick and string'], correct: 0 },
      { q: 'What do torches do?', options: ['give off light', 'make fire', 'keep you warm', 'scare away mobs'], correct: 0 }
    ]
  },

  {
    id: 'builtin-1-lore-2',
    level: 'grade1',
    type: 'lore',
    title: 'Skeletons at Night',
    text: 'Skeletons come out at night. They carry a bow and shoot arrows. You can hide behind a tree to dodge them. In the daytime, sunlight burns skeletons up. They drop bones when they die. Bones can be used to tame wolves.',
    questions: [
      { q: 'What do skeletons carry?', options: ['a bow', 'a sword', 'an axe', 'a shield'], correct: 0 },
      { q: 'What can you do with bones?', options: ['tame wolves', 'make soup', 'build a fence', 'plant them'], correct: 0 }
    ]
  },

  // ── GRADE 2 ───────────────────────────────────────────────────

  {
    id: 'builtin-2-adventure-1',
    level: 'grade2',
    type: 'adventure',
    title: 'Finding the Stronghold',
    text: "Steve set out to find a stronghold. He traded with a villager for some ender pearls. When he threw an ender pearl, it pointed him toward the stronghold. Deep underground, he found the portal room. The eyes of ender glowed in the frame.",
    questions: [
      { q: 'What did Steve trade for?', options: ['ender pearls', 'golden apples', 'diamond armor', 'a map'], correct: 0 },
      { q: 'Where did Steve find the portal room?', options: ['deep underground', 'in a village', 'on a mountain', 'in the ocean'], correct: 0 },
      { q: 'How did Steve find the stronghold?', options: ['he threw an ender pearl', 'he used a map', 'a villager told him', 'he dug straight down'], correct: 0 }
    ]
  },

  {
    id: 'builtin-2-lore-1',
    level: 'grade2',
    type: 'lore',
    title: 'The Nether',
    text: 'The Nether is a dangerous world below the regular world. It has lava lakes and dangerous mobs like ghasts and zombie pigmen. Ghasts float through the air and shoot fireballs. A player needs to reach the Nether to defeat the Ender Dragon.',
    questions: [
      { q: 'What kind of mobs are in the Nether?', options: ['ghasts and zombie pigmen', 'creepers and spiders', 'skeletons and zombies', 'wolves and foxes'], correct: 0 },
      { q: 'What do ghasts shoot?', options: ['fireballs', 'arrows', 'snowballs', 'potions'], correct: 0 },
      { q: 'Why might a player go to the Nether?', options: ['to defeat the Ender Dragon', 'to find diamonds', 'to trade with villagers', 'to find snow'], correct: 0 }
    ]
  },

  {
    id: 'builtin-2-howto-1',
    level: 'grade2',
    type: 'howto',
    title: 'Growing a Wheat Farm',
    text: 'A farm needs water to grow crops. Dig a row of soil next to a water source. Till the soil using a hoe. Plant seeds in the tilled soil. Wait for the plants to grow tall and turn yellow. Harvest the wheat by breaking it. Then use the wheat to make bread.',
    questions: [
      { q: 'What does a farm need to grow crops?', options: ['water', 'sunlight', 'bone meal', 'fertilizer'], correct: 0 },
      { q: 'What tool do you use to till soil?', options: ['a hoe', 'a shovel', 'an axe', 'a pickaxe'], correct: 0 }
    ]
  },

  {
    id: 'builtin-2-lore-2',
    level: 'grade2',
    type: 'lore',
    title: 'Helpful Bees',
    text: 'Bees are small but helpful mobs in Minecraft. They live in beehives found in flower forests and plains. Bees fly from flower to flower, collecting pollen. When a bee returns to its hive with pollen, the hive fills up with honey. Players can collect honey bottles or honeycomb from full hives. If you anger a bee, it will sting you and then die.',
    questions: [
      { q: 'Where do bees live?', options: ['in beehives', 'underground', 'in the ocean', 'in caves'], correct: 0 },
      { q: 'What happens after a bee stings you?', options: ['the bee dies', 'you get poison', 'the bee flies away', 'the hive attacks'], correct: 0 }
    ]
  },

  // ── GRADE 3 ───────────────────────────────────────────────────

  {
    id: 'builtin-3-adventure-1',
    level: 'grade3',
    type: 'adventure',
    title: 'The End Portal',
    text: "The End is the final dimension in Minecraft. To get there, a player must find a stronghold deep underground. Inside the stronghold is an End Portal, a frame made of twelve blocks. When each block holds an eye of ender, the portal opens. Stepping through sends the player into the void-filled End, where the Ender Dragon waits. Defeating the dragon is considered the main goal of the game.",
    questions: [
      { q: 'Where is the End Portal found?', options: ['inside a stronghold', 'in the Nether', 'at the top of a mountain', 'in a village temple'], correct: 0 },
      { q: 'How many blocks make up the End Portal frame?', options: ['twelve', 'eight', 'sixteen', 'ten'], correct: 0 },
      { q: 'What waits for the player in the End?', options: ['the Ender Dragon', 'the Wither', 'a giant creeper', 'an elder guardian'], correct: 0 }
    ]
  },

  {
    id: 'builtin-3-lore-1',
    level: 'grade3',
    type: 'lore',
    title: 'Villager Trades',
    text: "Villagers are peaceful mobs who live in villages. Each villager has a job, shown by their clothing and the block near their home called a workstation. A farmer wears a straw hat and works near a composter. A librarian wears glasses and works near a lectern. Villagers trade emeralds for goods, making them valuable allies to any player who learns their trades.",
    questions: [
      { q: 'How can you tell what job a villager has?', options: ['their clothing and workstation', 'the color of their skin', 'how tall they are', 'the time of day'], correct: 0 },
      { q: 'What does a librarian work near?', options: ['a lectern', 'a composter', 'a furnace', 'an anvil'], correct: 0 },
      { q: 'What do villagers use to trade?', options: ['emeralds', 'gold', 'diamonds', 'iron'], correct: 0 }
    ]
  },

  {
    id: 'builtin-3-howto-1',
    level: 'grade3',
    type: 'howto',
    title: 'Building a Nether Portal',
    text: "Building a Nether portal requires at least ten blocks of obsidian. Obsidian forms where water flows over lava source blocks, so you can create it yourself. Once you have shaped the obsidian into a rectangular frame at least four blocks wide and five blocks tall, use a flint and steel to ignite it. A swirling purple portal will appear inside the frame. Step through it to enter the Nether, but be ready for the heat and the hostile mobs that await you.",
    questions: [
      { q: 'How does obsidian form?', options: ['where water flows over lava', 'by mining deep underground', 'by smelting iron', 'in the Nether'], correct: 0 },
      { q: 'What do you use to ignite the portal?', options: ['flint and steel', 'a torch', 'fire charges', 'lava'], correct: 0 },
      { q: 'What shape is a Nether portal frame?', options: ['a rectangle', 'a circle', 'a triangle', 'a square'], correct: 0 }
    ]
  },

  // ── GRADE 4 ───────────────────────────────────────────────────

  {
    id: 'builtin-4-adventure-1',
    level: 'grade4',
    type: 'adventure',
    title: 'The Ancient City',
    text: "The ancient city lies deep in the dark caves below the surface. No torches light its halls, and strange sculk sensors line every passage, listening for the slightest sound. The Warden, a blind but powerful creature, patrols the darkness. It cannot see, but it detects vibrations in the ground. A player who dares to explore must move in complete silence, crouching slowly past the sensors to avoid waking the Warden. One careless step could mean the end.",
    questions: [
      { q: 'How does the Warden detect players?', options: ['by sensing vibrations', 'by seeing them', 'by smelling them', 'by hearing their voice'], correct: 0 },
      { q: 'What lines the passages of the ancient city?', options: ['sculk sensors', 'torches', 'bookshelves', 'soul sand'], correct: 0 },
      { q: 'What must a player do to avoid the Warden?', options: ['move in complete silence', 'run as fast as possible', 'fight it with a sword', 'use invisibility potions'], correct: 0 }
    ]
  },

  {
    id: 'builtin-4-howto-1',
    level: 'grade4',
    type: 'howto',
    title: 'Enchanting Your Gear',
    text: "Enchanting your gear makes you much stronger in Minecraft. First, build an enchanting table using obsidian, diamonds, and a book. Place bookshelves around the table to unlock higher-level enchantments. You need fifteen shelves for the maximum level. Use experience points, which you earn from mining and fighting mobs, to pay for enchantments. Each piece of gear can receive its own enchantments. With the right setup, you can become nearly unstoppable.",
    questions: [
      { q: 'What do bookshelves do for the enchanting table?', options: ['unlock higher-level enchantments', 'make it look nicer', 'give you more experience', 'allow you to craft books'], correct: 0 },
      { q: 'How many bookshelves do you need for maximum enchantments?', options: ['fifteen', 'ten', 'twenty', 'eight'], correct: 0 },
      { q: 'What do you use to pay for enchantments?', options: ['experience points', 'emeralds', 'gold ingots', 'lapis lazuli'], correct: 0 }
    ]
  },

  {
    id: 'builtin-4-lore-1',
    level: 'grade4',
    type: 'lore',
    title: 'The Ender Dragon',
    text: "The Ender Dragon is the final boss of Minecraft. It lives in The End, a dark dimension filled with floating islands of end stone. The dragon flies in circles above the main island, healing itself using crystals placed on top of tall obsidian pillars. To defeat it, players must first destroy all the crystals, then attack the dragon when it dives down toward the central fountain. After it is defeated, a portal home appears, and the dragon drops a massive amount of experience points.",
    questions: [
      { q: 'What does the Ender Dragon use to heal itself?', options: ['crystals on obsidian pillars', 'the end stone', 'the portal fountain', 'the void beneath'], correct: 0 },
      { q: 'What must players destroy before attacking the dragon?', options: ['all the crystals', 'the obsidian pillars', 'the end portal', 'the chorus trees'], correct: 0 },
      { q: 'What appears after the dragon is defeated?', options: ['a portal home', 'a treasure chest', 'a new island', 'the Wither'], correct: 0 }
    ]
  },

];
