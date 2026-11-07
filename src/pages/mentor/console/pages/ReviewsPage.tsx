import { Segmented } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { DocumentReviewList } from '../components/reviews/DocumentReviewList';
import { EssayReviewList } from '../components/reviews/EssayReviewList';
import { useReviewCounts } from '../components/reviews/reviewCounts';

type ReviewType = 'essay' | 'document';

/** One place to review student work — essays and shared documents. */
export default function ReviewsPage({ embedded = false }: { embedded?: boolean }) {
  const [params, setParams] = useSearchParams();
  const type: ReviewType = params.get('type') === 'document' ? 'document' : 'essay';
  const { essayCount, documentCount } = useReviewCounts();

  return (
    <div>
      {!embedded && <div className="mc-page-head mc-page-head--ruled">
        <div className="mc-page-eyebrow">
          Mentor <span className="mc-page-eyebrow-accent">· Student work</span>
        </div>
        <h1 className="mc-page-title">Reviews</h1>
        <p className="mc-page-lead">
          Essays and documents your students have shared with you, in one queue.
        </p>
      </div>}
      <Segmented
        value={type}
        onChange={(value) => setParams((current) => { current.set('type', String(value)); return current; }, { replace: true })}
        options={[
          { value: 'essay', label: `Essays${essayCount > 0 ? ` (${essayCount})` : ''}` },
          { value: 'document', label: `Documents${documentCount > 0 ? ` (${documentCount})` : ''}` },
        ]}
        style={{ marginBottom: 24 }}
      />
      {type === 'essay' ? <EssayReviewList /> : <DocumentReviewList />}
    </div>
  );
}
