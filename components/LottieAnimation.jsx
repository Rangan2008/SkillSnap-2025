'use client';

import Lottie from 'lottie-react';
import animationData from '@/public/lottie/animation.json';

export default function LottieAnimation() {
    return (
        <Lottie
            animationData={animationData}
            loop
            autoplay
            className="w-[360px] h-[240px]"
        />
    );
}
