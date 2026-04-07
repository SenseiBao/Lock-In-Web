import { useState, useCallback } from "react";
import useSound from 'use-sound';
import powerupSfx from '../assets/sounds/powerup.mp3';

/* -------------------- */
/* Utility: Shuffle     */
/* -------------------- */
const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/* -------------------- */
/* Word List            */
/* -------------------- */
const INITIAL_WORDS = [
    // Food & Drink
    "PIZZA", "BURGER", "SUSHI", "TACO", "PANCAKE", "CHOCOLATE", "POPCORN", "SMOOTHIE", "COFFEE", "NACHOS",
    "LEMONADE", "BACON", "DONUT", "SPAGHETTI", "CHEESECAKE", "MILKSHAKE", "BURRITO", "WAFFLE", "PINEAPPLE", "CARAMEL",
    "BUTTER", "OIL", "PEACH", "GUM", "SNACK", "DRESSING", "LUNCH", "ICE CREAM", "BAO", "MARIJUANA",

    // Animals
    "DOLPHIN", "PENGUIN", "ELEPHANT", "GIRAFFE", "KANGAROO", "SHARK", "BUTTERFLY", "OCTOPUS", "FLAMINGO", "GORILLA",
    "CHEETAH", "CROCODILE", "PORCUPINE", "HAMSTER", "CHAMELEON", "PEACOCK", "PLATYPUS", "BISON", "LOBSTER", "FIREFLY",
    "MOUSE", "DINOSAUR", "ALLIGATOR", "ORCA", "CRAB", "DRAGON",

    // Places
    "BEACH", "MUSEUM", "AIRPORT", "LIBRARY", "HOSPITAL", "ZOO", "STADIUM", "LIGHTHOUSE", "VOLCANO", "SUPERMARKET",
    "CASINO", "SKYSCRAPER", "CEMETERY", "SUBWAY", "ROOFTOP", "PENTHOUSE", "BARN", "LAKE", "BRAZIL", "CHINA",
    "CHICAGO", "LOS ANGELES", "COLLEGE", "MANSION",

    // Characters & Professions
    "SUPERHERO", "VAMPIRE", "PIRATE", "MERMAID", "WIZARD", "NINJA", "ASTRONAUT", "DETECTIVE", "COWBOY", "ROBOT",
    "ZOMBIE", "GLADIATOR", "WITCH", "SAMURAI", "VIKING", "CLOWN", "SPY", "CHEF", "LIFEGUARD", "GOBLIN",
    "BARBARIAN", "SKELETON", "PRINCE", "PRINCESS", "WAITER", "VET", "POKEMON", "GODZILLA", "KING KONG", "LUIGI",
    "BATMAN", "JOKER", "BILLIONAIRE", "WIDOW", "ANGEL", "DEMON", "GHOST", "ALIEN",
    "ZEUS", "POSEIDON", "HADES", "CYCLOPS", "ELF",
    "JESUS", "BUDDHA", "GANDHI", "MARTIN LUTHER KING JR", "KIM JONG-UN",

    // Technology & Objects
    "SMARTPHONE", "LAPTOP", "HEADPHONES", "PASSWORD", "SELFIE", "PODCAST", "STREAMING", "EMOJI", "CHARGER", "DRONE",
    "SUBSCRIPTION", "INFLUENCER", "MEME", "HACKER", "DISHWASHER", "HELICOPTER", "ROCKET",
    "PIANO", "CODE", "GLASSES", "WINDOW", "NUCLEAR BOMB",

    // Sports & Activities
    "SOCCER", "BASKETBALL", "TENNIS", "GOLF", "BOXING", "SURFING", "SKIING", "BASEBALL", "MARATHON", "GYMNASTICS",
    "SKATEBOARDING", "SKYDIVING", "WRESTLING", "ARCHERY", "FENCING", "BOWLING", "KARATE", "ROWING",

    // Weather & Nature
    "TORNADO", "GLACIER", "WATERFALL", "EARTHQUAKE", "THUNDER", "HURRICANE", "LIGHTNING", "BLIZZARD", "AVALANCHE", "RAINBOW",
    "QUICKSAND", "DROUGHT", "METEOR", "SANDSTORM", "HEATWAVE", "FOG", "MUDSLIDE", "GEYSER",

    // Events & Situations
    "BIRTHDAY", "WEDDING", "GRADUATION", "FUNERAL", "VACATION", "BLACKOUT", "PROTEST", "AUCTION", "KARAOKE", "CAMPING",
    "PROM", "LAYOVER", "LECTURE", "THANKSGIVING", "CHRISTMAS", "EASTER", "VALENTINE'S DAY",

    // Abstract & Concepts
    "NIGHTMARE", "JEALOUSY", "PROCRASTINATION", "CONSPIRACY", "HEARTBREAK", "GOSSIP", "INSOMNIA", "NOSTALGIA", "BURNOUT", "ADDICTION",
    "AMNESIA", "BRAINSTORM", "WANDERLUST", "STALE", "MUMBLE", "REGRET", "ASIAN", "BLACK", "RIZZ",
];

export const GAME_MODES = {
    /** Two teams, two describers, race to majority of the deck */
    TEAMS: 'teams',
    /** One describer; everyone cooperates for a high score */
    SOLO: 'solo',
};

/** Co-op mode: skips after this many cost 1 point each (score floored at 0) */
export const COOP_FREE_SKIPS = 2;

/** Shared co-op countdown (wall-clock end stored in `coop_timer_end_at`) */
export const COOP_TIMER_INITIAL_SECONDS = 120;
export const COOP_TIMER_CORRECT_BONUS_SEC = 40;
export const COOP_TIMER_BUZZ_PENALTY_SEC = 5;
export const COOP_HINT_PENALTY_SEC = 3;

const POWER_UPS = {
    1: { name: "Whiteboard Challenge", desc: "No words! Both Describers draw on their own whiteboards at the same time." },
    2: { name: "Simultaneous Charades", desc: "No words! Both Describers act out the word at the same time. Noises and sounds are allowed." },
    3: { name: "Low Bandwidth", desc: "Describers can only use one-syllable words for hints." },
    4: { name: "Data Corruption", desc: "Forbidden Letters! Roll again: 1=E, 2=T, 3=A, 4=O, 5=I, 6=N." },
    5: { name: "High Traffic", desc: "No alternating! Both Describers can give hints nonstop at the same time." },
    6: { name: "Reverse Roles", desc: "The Guesser now describes, the Describer now guesses! Draw a new card for this turn only." }
};

/** Shown when digital dice hits a power-up in solo (co-op) mode */
const SOLO_POWER_UPS = {
    1: { name: "Whiteboard Challenge", desc: "No words! Draw the word on a whiteboard." },
    2: { name: "Charades", desc: "No words! Act out the word. Noises and sounds are allowed." },
    3: { name: "Low Bandwidth", desc: "You can only use one-syllable words for hints." },
    4: { name: "Data Corruption", desc: "Forbidden Letters! Roll again: 1=E, 2=T, 3=A, 4=O, 5=I, 6=N." },
    5: { name: "Rapid Fire", desc: "Give hints as fast as you want — no penalty for giving hints this round." },
    6: { name: "Reverse Roles", desc: "Reverse roles: a guesser gives hints, the describer guesses." }
};

/* -------------------- */
/* Game Logic Hook      */
/* -------------------- */
export const useGameLogic = () => {

    const [gameMode, setGameMode] = useState(GAME_MODES.TEAMS);

    const [deck, setDeck] = useState(() => shuffle(INITIAL_WORDS));
    const [currentWord, setCurrentWord] = useState(null);

    const [teamAScore, setTeamAScore] = useState(0);
    const [teamBScore, setTeamBScore] = useState(0);

    const [teamAWords, setTeamAWords] = useState([]);
    const [teamBWords, setTeamBWords] = useState([]);

    const [soloScore, setSoloScore] = useState(0);
    const [soloWords, setSoloWords] = useState([]);
    /** Remaining no-penalty skips in co-op; when 0, each completed skip costs 1 point */
    const [soloFreeSkipsRemaining, setSoloFreeSkipsRemaining] = useState(COOP_FREE_SKIPS);

    const [diceResult, setDiceResult] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [activePowerUp, setActivePowerUp] = useState(null);
    const [playPowerUp] = useSound(powerupSfx);

    const [phase, setPhase] = useState("idle");
    // idle | drawn | resolved

    /* -------------------- */
    /* Dice Logic           */
    /* -------------------- */
    const FORBIDDEN_LETTERS = { 1: 'E', 2: 'T', 3: 'A', 4: 'O', 5: 'I', 6: 'N' };

    const rollDice = () => {
        if (isRolling) return; // prevent spamming

        setIsRolling(true);
        setActivePowerUp(null);

        const table = gameMode === GAME_MODES.SOLO ? SOLO_POWER_UPS : POWER_UPS;

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            setDiceResult(roll);

            // Trigger power-up on 5 or 6
            if (roll === 5 || roll === 6) {
                playPowerUp();
                const powerRoll = Math.floor(Math.random() * 6) + 1;

                if (powerRoll === 4) {
                    // Auto-pick the forbidden letter instead of asking players to re-roll
                    const letterRoll = Math.floor(Math.random() * 6) + 1;
                    const letter = FORBIDDEN_LETTERS[letterRoll];
                    setActivePowerUp({
                        ...table[4],
                        desc: `Forbidden letter: "${letter}". No hints may contain the letter ${letter}.`
                    });
                } else {
                    setActivePowerUp(table[powerRoll]);
                }
            }

            setIsRolling(false);
        }, 600);
    };

    /* -------------------- */
    /* Draw Card            */
    /* -------------------- */
    const drawCard = useCallback(() => {
        if (deck.length === 0) {
            setCurrentWord(null);
            return null;
        }

        const newDeck = [...deck];
        const word = newDeck.pop();

        setDeck(newDeck);
        setCurrentWord(word);
        setPhase("drawn");

        return word;
    }, [deck]);

    /* -------------------- */
    /* Record Win           */
    /* -------------------- */
    const recordTeamWin = (isTeamA) => {
        if (!currentWord) return;

        const word = currentWord;

        if (isTeamA) {
            setTeamAScore(prev => prev + 1);
            setTeamAWords(prev => [...prev, word]);
        } else {
            setTeamBScore(prev => prev + 1);
            setTeamBWords(prev => [...prev, word]);
        }

        setCurrentWord(null);
        setPhase("resolved");
    };

    const recordSoloWin = () => {
        if (!currentWord) return;

        const word = currentWord;
        setSoloScore(prev => prev + 1);
        setSoloWords(prev => [...prev, word]);
        setCurrentWord(null);
        setPhase("resolved");
    };

    /** Call when describers complete a skip in co-op (host draws next card). First COOP_FREE_SKIPS are free; then −1 pt each. */
    const recordCoopSkip = useCallback(() => {
        setSoloFreeSkipsRemaining((prevFree) => {
            if (prevFree > 0) return prevFree - 1;
            setSoloScore((s) => Math.max(0, s - 1));
            return 0;
        });
    }, []);

    /* -------------------- */
    /* Reset Game           */
    /* -------------------- */
    const resetGame = () => {
        setDeck(shuffle(INITIAL_WORDS));
        setTeamAScore(0);
        setTeamBScore(0);
        setTeamAWords([]);
        setTeamBWords([]);
        setSoloScore(0);
        setSoloWords([]);
        setSoloFreeSkipsRemaining(COOP_FREE_SKIPS);
        setCurrentWord(null);
        setDiceResult(null);
        setPhase("idle");
        setActivePowerUp(null);
    };

    /* -------------------- */
    /* Win Condition        */
    /* -------------------- */
    const winner =
        gameMode !== GAME_MODES.TEAMS ? null :
            teamAScore >= 13 ? "A" :
                teamBScore >= 13 ? "B" :
                    null;

    return {
        // state
        gameMode,
        setGameMode,
        currentWord,
        deckCount: deck.length,
        teamAScore,
        teamBScore,
        teamAWords,
        teamBWords,
        soloScore,
        soloWords,
        soloFreeSkipsRemaining,
        diceResult,
        isRolling,
        activePowerUp,
        phase,
        winner,

        // actions
        drawCard,
        recordTeamWin,
        recordSoloWin,
        recordCoopSkip,
        resetGame,
        rollDice,
        setPhase
    };
};
