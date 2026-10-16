"""What the app has built in: levels, pictures, friends, snacks and gifts, with their names.

A puzzle on the server can only use these (the app can't draw anything else). Keep them in step with the
app: app/src/data/levels.ts, app/src/data/games.ts and app/src/data/puzzles.ts (PICTURE_INFO).
"""

# The 10 levels: one stop each on the Jalebi Express's trip round India (STORY.md).
LEVELS = {
    1: "Jalebi Junction",
    2: "Punjab",
    3: "Rajasthan",
    4: "Gujarat",
    5: "Mumbai",
    6: "Kerala",
    7: "Tamil Nadu",
    8: "Kolkata",
    9: "The Hills",
    10: "Home for Diwali",
}
LAST_LEVEL = max(LEVELS)

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
