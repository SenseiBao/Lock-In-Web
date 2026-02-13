import { useState, useCallback } from "react";

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
    "APPLE", "BREAD", "CHAIR", "EAGLE", "GLASS", "HOUSE", "ISLAND", "JACKET", "KITCHEN", "LEMON",
    "MOUNTAIN", "ORANGE", "PILLOW", "QUEEN", "RIVER", "STREET", "TABLE", "UMBRELLA", "VALLEY", "WINDOW",
    "ZEBRA", "AIRPORT", "CAMERA", "ENGINE", "FOREST", "GARDEN", "HAMMER", "INSECT", "LADDER", "MIRROR",
    "OCEAN", "POCKET", "RABBIT", "SCHOOL", "TIGER", "VILLAGE", "WALNUT", "BOTTLE", "COFFEE", "DESERT",
    "ELBOW", "FINGER", "GUITAR", "HELMET", "ICEBERG", "JUNGLE", "KNIFE", "LETTER", "MONKEY", "OVEN",
    "PENCIL", "ROCKET", "SADDLE", "TOMATO", "VIOLIN", "BAMBOO", "CRAYON", "DRAGON", "FLOWER", "GHOST",
    "HARBOR", "IRON", "KANGAROO", "LANTERN", "MAGNET", "NEEDLE", "ONION", "PARROT", "REMOTE", "SILVER",
    "TUNNEL", "UNIFORM", "VACUUM", "WAGON", "XRAY", "ANCHOR", "BUBBLE", "CASTLE", "DOCTOR", "FARMER",
    "GOBLIN", "HUNTER", "INFANT", "JOKER", "KNIGHT", "LAWYER", "PLAYER", "TARGET", "VESSEL", "WIZARD",
    "ACTOR", "DANCE", "JOURNEY", "PARTY", "RECORD", "ATTACK", "ESCAPE", "BUILD", "CHASE", "BRIGHT",
    "COLD", "DARK", "FAST", "HAPPY", "LARGE", "MODERN", "NOBLE", "PROUD", "QUICK", "SMALL",
    "TOUGH", "WILD", "YOUNG", "CLEAN", "DIRTY", "EARLY", "FULL", "GREEN", "HEAVY", "LIGHT",
    "MUDDY", "NARROW", "PLAIN", "QUIET", "READY", "SHARP", "THICK", "WIDE", "BRAVE", "FINAL",
    "GRAND", "HUGE", "LUCKY", "MAGIC", "FAMOUS"
];

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

    const [phase, setPhase] = useState("idle");
    // idle | drawn | resolved

    /* -------------------- */
    /* Dice Logic           */
    /* -------------------- */
    const rollDice = () => {
        if (isRolling) return;

        setIsRolling(true);
        setDiceResult(null);

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            setDiceResult(roll);
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
