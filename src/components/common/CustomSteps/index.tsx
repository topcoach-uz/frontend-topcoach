import { useState } from 'react';
import styles from './CustomSteps.module.scss';

export interface ICustomStep {
  key: string;
  content: React.ReactNode;
}

interface CustomStepsProps {
  steps: ICustomStep[];
}

const CustomSteps: React.FC<CustomStepsProps> = ({ steps }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div>
      <div className={styles.stepsContainer}>
        {steps.map((_, index) => (
          <div
            key={index}
            className={styles.stepWrapper}
            onClick={() => handleStepClick(index)}
          >
            <div
              className={`${styles.step} ${index === currentStep ? styles.active : ''}`}
            ></div>
          </div>
        ))}
      </div>
      <div className={styles.stepContent}>{steps[currentStep].content}</div>
    </div>
  );
};

export default CustomSteps;
