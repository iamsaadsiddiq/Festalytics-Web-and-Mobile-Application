import React from 'react';

const EventStepper = ({ currentStep, totalSteps }) => {
    return (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
            <div
                className="h-full bg-[#D6336C] transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
        </div>
    );
};

export default EventStepper;
