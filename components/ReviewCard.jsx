// --- Review Card Component ---
const ReviewCard = ({ review, onImageClick }) => {
  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Reviewer Info */}
      <div className="flex items-center mb-2.5">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-lg mr-2.5 uppercase">
          {getInitials(review.author)}
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-gray-800 flex items-center">
            {review.author}
            {review.verified && (
              <span className="text-green-500 ml-1.5 text-sm" title="Verified Customer">
                ✔
              </span>
            )}
          </div>
          {review.verified && (
            <div className="text-xs text-gray-600">ভেরিফাইড কাস্টমার</div>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="mb-2.5">
        <StarRating rating={review.rating} />
      </div>

      {/* Review Text */}
      <p className="text-gray-700 text-sm leading-relaxed mb-3">
        {review.text}
      </p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5">
          {review.images.map((imageSrc, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded overflow-hidden cursor-pointer shrink-0"
              onClick={() => onImageClick(imageSrc, review.images)}
            >
              <img
                src={imageSrc}
                alt={`Review image ${index + 1}`}
                className="w-[70px] h-[70px] object-cover"
                onError={(e) => e.target.src = 'https://placehold.co/70x70/FEEBC8/9C4221?text=Error'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;