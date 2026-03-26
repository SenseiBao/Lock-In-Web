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

const POWER_UPS = {
    1: { name: "Whiteboard Challenge", desc: "Share a whiteboard. Describers take turns drawing one continuous stroke." },
    2: { name: "Simultaneous Charades", desc: "No talking. Both Describers act out the word at the same time." },
    3: { name: "Low Bandwidth", desc: "Describers can only use one-syllable words for hints." },
    4: { name: "Data Corruption", desc: "Forbidden Letters! Roll again: 1=E, 2=T, 3=A, 4=O, 5=I, 6=N." },
    5: { name: "High Traffic", desc: "Simultaneous Guessing: Both Describers hint and both Guessers shout." },
    6: { name: "Lookahead", desc: "Both Guessers view 3 random cards. Shuffle, draw new, and re-roll." }
};

/* -------------------- */
/* Game Logic Hook      */
/* -------------------- */
export const useGameLogic = () => {

    const [deck, setDeck] = useState(() => shuffle(INITIAL_WORDS));
    const [currentWord, setCurrentWord] = useState(null);

    const [teamAScore, setTeamAScore] = useState(0);
    const [teamBScore, setTeamBScore] = useState(0);

    const [teamAWords, setTeamAWords] = useState([]);
    const [teamBWords, setTeamBWords] = useState([]);

    const [diceResult, setDiceResult] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [activePowerUp, setActivePowerUp] = useState(null);
    const [lookaheadCards, setLookaheadCards] = useState([]);
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
        setLookaheadCards([]);

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            setDiceResult(roll);

            // Trigger power-up on 5 or 6
            if (roll === 5 || roll === 6) {
                if (!activePowerUp) {
                    playPowerUp();
                }
                const powerRoll = Math.floor(Math.random() * 6) + 1;

                if (powerRoll === 4) {
                    // Auto-pick the forbidden letter instead of asking players to re-roll
                    const letterRoll = Math.floor(Math.random() * 6) + 1;
                    const letter = FORBIDDEN_LETTERS[letterRoll];
                    setActivePowerUp({
                        ...POWER_UPS[4],
                        desc: `Forbidden letter: "${letter}". No hints may contain the letter ${letter}.`
                    });
                } else if (powerRoll === 6) {
                    // Lookahead: peek at up to 3 random cards from the deck
                    setActivePowerUp(POWER_UPS[6]);
                    setDeck(prevDeck => {
                        const indices = new Set();
                        while (indices.size < Math.min(3, prevDeck.length)) {
                            indices.add(Math.floor(Math.random() * prevDeck.length));
                        }
                        const peeked = [...indices].map(i => prevDeck[i]);
                        setLookaheadCards(peeked);
                        return prevDeck; // deck unchanged
                    });
                } else {
                    setActivePowerUp(POWER_UPS[powerRoll]);
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
    const recordWin = (isTeamA) => {
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

    /* -------------------- */
    /* Reset Game           */
    /* -------------------- */
    const resetGame = () => {
        setDeck(shuffle(INITIAL_WORDS));
        setTeamAScore(0);
        setTeamBScore(0);
        setTeamAWords([]);
        setTeamBWords([]);
        setCurrentWord(null);
        setDiceResult(null);
        setPhase("idle");
        setActivePowerUp(null);
        setLookaheadCards([]);
    };

    /* -------------------- */
    /* Win Condition        */
    /* -------------------- */
    const winner =
        teamAScore >= 13 ? "A" :
            teamBScore >= 13 ? "B" :
                null;

    return {
        // state
        currentWord,
        deckCount: deck.length,
        teamAScore,
        teamBScore,
        teamAWords,
        teamBWords,
        diceResult,
        isRolling,
        activePowerUp,
        lookaheadCards,
        phase,
        winner,

        // actions
        drawCard,
        recordWin,
        resetGame,
        rollDice,
        setPhase
    };
};
