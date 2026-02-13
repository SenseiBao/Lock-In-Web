import { motion } from 'framer-motion';

const Dice = ({ value, isRolling }) => {
    // Animation for the "rolling" state
    const rollAnimation = {
        rotate: [0, 90, 180, 270, 360],
        x: [0, -5, 5, -5, 5, 0],
        y: [0, -2, 2, -2, 2, 0],
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <motion.div
                animate={isRolling ? rollAnimation : { rotate: 0 }}
                transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
                className="w-16 h-16 bg-white rounded-xl border-4 border-card-gold flex items-center justify-center shadow-lg"
            >
                {isRolling ? (
                    <span className="text-dark-bg text-2xl font-black">?</span>
                ) : (
                    <span className="text-dark-bg text-3xl font-black">
            {value || "🎲"}
          </span>
                )}
            </motion.div>

            {/* Power-up hint if roll is 6 */}
            {!isRolling && value === 6 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-pass-orange text-xs font-bold uppercase"
                >
                    ⚠️ Power-Up!
                </motion.div>
            )}
        </div>
    );
};

export default Dice;