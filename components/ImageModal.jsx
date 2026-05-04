// --- Image Modal Component ---
const ImageModal = ({ images, initialImage, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const initialIndex = images.indexOf(initialImage);
    if (initialIndex !== -1) {
      setCurrentIndex(initialIndex);
    }
  }, [initialImage, images]);

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleThumbnailClick = (e, index) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg p-4 w-full max-w-sm flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full text-3xl text-gray-700 cursor-pointer flex items-center justify-center shadow-lg"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Main Image */}
        <div className="relative w-full h-64 sm:h-80 mb-4">
          <img
            src={images[currentIndex]}
            alt="Full screen review"
            className="w-full h-full object-contain"
            onError={(e) => e.target.src = 'https://placehold.co/300x300/FEEBC8/9C4221?text=Error'}
          />

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 cursor-pointer text-2xl z-10 flex items-center justify-center"
                onClick={goToPrevious}
              >
                &lt;
              </button>
              <button
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 cursor-pointer text-2xl z-10 flex items-center justify-center"
                onClick={goToNext}
              >
                &gt;
              </button>
            </>
          )}
        </div>

        {/* Thumbnails Carousel */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto w-full justify-center p-2">
            {images.map((imageSrc, index) => (
              <div
                key={index}
                className={`border-2 cursor-pointer rounded overflow-hidden shrink-0 ${
                  index === currentIndex ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={(e) => handleThumbnailClick(e, index)}
              >
                <img
                  src={imageSrc}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-16 h-16 object-cover"
                  onError={(e) => e.target.src = 'https://placehold.co/64x64/FEEBC8/9C4221?text=Error'}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;