import styles from './aiMajorMatch.module.scss';
import { useAiMajorMatch } from './useAiMajorMatch';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Questionnaire } from './components/Questionnaire';
import { Results } from './components/Results';
import { AnalysisLoader } from './components/AnalysisLoader';

const AiMajorMatchPage = () => {
  const {
    step,
    setStep,
    questions,
    answers,
    setAnswers,
    results,
    isLoading,
    error,
    handleStart,
    handleSubmit,
  } = useAiMajorMatch();

  const handleRetake = () => {
    setAnswers({});
    setStep('intro');
  };

  if (isLoading) {
    return <AnalysisLoader />;
  }

  if (error) {
    // A more user-friendly error message can be added here
    console.error('AI Major Match Error:', error);
    return <div>An unexpected error occurred. Please try again later.</div>;
  }

  return (
    <div className={styles.container}>
      {step === 'intro' && <WelcomeScreen onStart={handleStart} />}
      {step === 'assessment' && questions && (
        <Questionnaire
          questions={questions}
          answers={answers}
          setAnswers={setAnswers}
          onSubmit={handleSubmit}
        />
      )}
      {step === 'results' && (
        <Results results={results} onRetake={handleRetake} />
      )}
    </div>
  );
};

export default AiMajorMatchPage; 