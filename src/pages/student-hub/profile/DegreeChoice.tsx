import { BookOpen, Check, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './DegreeChoice.scss';

type Degree = 'bachelor' | 'master';

/**
 * Two-option degree picker (replaces a Select). Works as an AntD Form control:
 * receives `value` / `onChange` from <Form.Item>.
 */
export default function DegreeChoice({
  value,
  onChange,
  disabled = false,
}: {
  value?: Degree;
  onChange?: (value: Degree) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const options: { value: Degree; title: string; hint: string; Icon: typeof GraduationCap }[] = [
    {
      value: 'bachelor',
      title: t('studentHub.applications.degreeBachelor', 'Bachelor’s'),
      hint: t('studentHub.profile.degreeBachelorHint', 'Undergraduate · your first degree'),
      Icon: GraduationCap,
    },
    {
      value: 'master',
      title: t('studentHub.applications.degreeMaster', 'Master’s'),
      hint: t('studentHub.profile.degreeMasterHint', 'Graduate · after a bachelor’s degree'),
      Icon: BookOpen,
    },
  ];

  return (
    <div className="degree-choice" role="radiogroup">
      {options.map(({ value: option, title, hint, Icon }) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            className={`degree-choice__option${selected ? ' is-selected' : ''}`}
            onClick={() => onChange?.(option)}
          >
            <span className="degree-choice__icon" aria-hidden>
              <Icon size={20} strokeWidth={1.8} />
            </span>
            <span className="degree-choice__text">
              <strong>{title}</strong>
              <small>{hint}</small>
            </span>
            <span className="degree-choice__check" aria-hidden>
              {selected && <Check size={14} strokeWidth={2.6} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
