"""What the app has built in: levels, pictures, friends, snacks and gifts, with their names.

A puzzle on the server can only use these (the app can't draw anything else). Keep them in step with the
app: app/src/data/levels.ts, app/src/data/games.ts and app/src/data/puzzles.ts (PICTURE_INFO).
"""

# The levels, in the order the Jalebi Express visits them: from Jammu & Kashmir at the top of India to Kanyakumari
# at the very tip (STORY.md; the stops still to come are in ROUTE.md). The number is the level's id, which never
# changes (phones keep stars and story cards by it, and older apps know the levels by it), so a new stop gets the
# next free number and goes wherever it belongs in this list. The app shows a level's place on the trip: STOP.
LEVELS = {
    1: "Jammu & Kashmir",
    2: "Punjab",
    9: "The Hills",
    8: "Kolkata",
    3: "Rajasthan",
    4: "Gujarat",
    5: "Mumbai",
    7: "Tamil Nadu",
    6: "Kerala",
    10: "Kanyakumari",
}
STOP = {n: i + 1 for i, n in enumerate(LEVELS)}  # level id -> its place on the trip ("Level 3" in the app)
LAST_LEVEL = list(LEVELS)[-1]  # the last stop: Diwali at Kanyakumari

# Pictures for jigsaws and slide puzzles.
PICTURES = {
    "gappu": "Gappu the Goat",
    "mithu": "Mithu the Parrot",
    "tillu": "Tillu the Tortoise",
    "chunnu": "Chunnu the Monkey",
    "shop": "Gappu's Jalebi Shop",
    "diwali-shop": "Gappu's Diwali Shop",
    "station": "All Aboard at Jalebi Junction",
    "bholu": "Bholu in the Mustard Fields",
    "kesar": "Kesar at the Desert Fair",
    "raja": "Raja and the Kites",
    "chikki": "Chikki in the Monsoon",
    "appu": "Appu on the Backwaters",
    "mayil": "Mayil's Pongal Morning",
    "bagha": "Bagha by the Howrah Bridge",
    "momo": "Momo in the Hills",
    "kites": "Kites in the Sky",
    "boat-race": "The Snake Boat Race",
    "toy-train": "The Toy Train",
    "big-picture": "The Big Picture",
}

FRIENDS = {
    "gappu": "Gappu",
    "mithu": "Mithu",
    "tillu": "Tillu",
    "chunnu": "Chunnu",
    "gauri": "Gauri",
    "pip": "Pip",
    "bholu": "Bholu",
    "kesar": "Kesar",
    "raja": "Raja",
    "chikki": "Chikki",
    "appu": "Appu",
    "mayil": "Mayil",
    "bagha": "Bagha",
    "momo": "Momo",
}

SNACKS = {
    "jalebi": "Jalebi",
    "laddoo": "Laddoo",
    "samosa": "Samosa",
    "chai": "Chai",
    "kulfi": "Kulfi",
    "mango": "Mango",
    "kajukatli": "Kaju katli",
    "gulabjamun": "Gulab jamun",
    "barfi": "Barfi",
    "lassi": "Lassi",
    "makkiroti": "Makki di roti",
    "ghevar": "Ghevar",
    "dalbaati": "Dal baati",
    "dhokla": "Dhokla",
    "fafda": "Fafda",
    "vadapav": "Vada pav",
    "modak": "Modak",
    "appam": "Appam",
    "coconut": "Coconut",
    "idli": "Idli",
    "dosa": "Dosa",
    "rasgulla": "Rasgulla",
    "mishtidoi": "Mishti doi",
    "momos": "Momos",
}

# Gifts friends bring to the Mela. A maze can hide one of these, or a snack, for Gappu to find.
GIFTS = {"dhol": "Dhol", "puppet": "Puppet", "kite": "Kite", "flowers": "Flowers", "sugarcane": "Sugarcane"}
MAZE_GOALS = {**SNACKS, **GIFTS}

# Rangoli patterns (app/src/game/rangoli.ts).
RANGOLI_STYLES = {"rangoli": "Rangoli", "kolam": "Kolam", "pookalam": "Pookalam", "alpana": "Alpana", "mandana": "Mandana"}
RANGOLI_SHAPES = {"disc", "petal", "drop", "dot", "diamond", "leaf"}
RANGOLI_COLORS = {"red", "orange", "yellow", "green", "blue", "purple", "pink", "white"}
