import { motion } from 'framer-motion';
import cardBackImg from '../assets/images/card_back.jpg'; // Make sure this file exists!

const Card = ({ word, isFlipped }) => {
    return (
        <div className="perspective-1000 w-[350px] h-[500px]">
            <motion.div
                className="relative w-full h-full transition-all duration-500 preserve-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* BACK OF CARD (Visible when isFlipped = false) */}
                <div className="absolute w-full h-full backface-hidden rounded-2xl shadow-2xl overflow-hidden border-4 border-card-gold bg-dark-bg">
                    {/* If image fails, it shows the dark background */}
                    <img
                        src={cardBackImg}
                        alt="Card Back"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* FRONT OF CARD (Visible when isFlipped = true) */}
                <div className="absolute w-full h-full backface-hidden bg-card-gold rounded-2xl flex items-center justify-center rotate-y-180 shadow-2xl border-4 border-white/20">
                    <h2 className="text-dark-bg text-5xl font-black text-center px-4 uppercase drop-shadow-md break-words">
                        {word || "???"}
                    </h2>
                </div>
            </motion.div>
        </div>
    );
};

export default Card;