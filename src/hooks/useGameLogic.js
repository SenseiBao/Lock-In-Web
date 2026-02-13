import { useState, useCallback } from 'react';

// Word List
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

export const useGameLogic = () => {
    const [deck, setDeck] = useState(() => [...INITIAL_WORDS].sort(() => Math.random() - 0.5));
    const [currentWord, setCurrentWord] = useState(null);
    const [teamAScore, setTeamAScore] = useState(0);
    const [teamBScore, setTeamBScore] = useState(0);
    const [teamAWords, setTeamAWords] = useState([]);
    const [teamBWords, setTeamBWords] = useState([]);

    const drawCard = useCallback(() => {
        if (deck.length === 0) return "GAME OVER";
        const newDeck = [...deck];
        const word = newDeck.pop();
        setDeck(newDeck);
        setCurrentWord(word);
        return word;
    }, [deck]);

    const recordWin = (isTeamA) => {
        if (!currentWord || currentWord === "GAME OVER") return;

        if (isTeamA) {
            setTeamAScore(prev => prev + 1);
            setTeamAWords(prev => [...prev, currentWord]);
        } else {
            setTeamBScore(prev => prev + 1);
            setTeamBWords(prev => [...prev, currentWord]);
        }
        setCurrentWord(null);
    };

    const resetGame = () => {
        setDeck([...INITIAL_WORDS].sort(() => Math.random() - 0.5));
        setTeamAScore(0);
        setTeamBScore(0);
        setTeamAWords([]);
        setTeamBWords([]);
        setCurrentWord(null);
    };

    return {
        currentWord,
        deckCount: deck.length,
        teamAScore,
        teamBScore,
        teamAWords,
        teamBWords,
        drawCard,
        recordWin,
        resetGame
    };
};