const ProductDisplay = ({ products, type }) => {
  if (!products || !products.length) return null;

  // Handle review display if type is review
  if (type === 'review') {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4 max-w-screen-sm">
        {products.map(product => (
          product.reviews ? (
            <ProductReviewBlock key={product.id} product={product} />
          ) : null
        ))}
      </div>
    );
  }

  // Box1: Single line product display
  if (type === 'Box1') {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4 max-w-screen-sm">
        <div className="space-y-2">
          {products.slice(0, 1).map(product => (  // Single product for Box1
            <ProductItem key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  // Box2: Grid layout 2 per row
  if (type === 'Box2') {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4 max-w-screen-sm">
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {products.slice(0, 6).map(product => (
            <ProductItem key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

// Product item sub-component
const ProductItem = ({ product }) => {

  return (
    <div className="border border-gray-200 rounded p-3 flex flex-col bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors relative" onClick={() => window.open(product.detailLink, '_blank')}>
      {product.rank && (
        <div className="absolute top-0 left-0 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg z-10">
          #{product.rank}
        </div>
      )}
      {/* Debug: {JSON.stringify(product)} */}
      <img
        src={product.image || '/placeholder-image.svg'}
        alt={product.name}
        className="w-full h-32 object-cover mb-2 rounded"
        onError={(e) => { e.target.src = '/placeholder-image.svg'; }}
      />
      <h4 className="text-sm text-gray-800 font-medium mb-1 line-clamp-2 leading-tight min-h-10 flex items-center">{product.name}</h4>
      <p className="text-lg font-bold text-green-600 mb-1">{typeof product.price === 'number' ? product.price.toLocaleString() : product.price} 원</p>
    </div>
  );
};

// Product review block for review display
const ProductReviewBlock = ({ product }) => {
  return (
    <div className="border border-gray-200 rounded p-4 mb-4 bg-gray-50">
      <div className="flex items-center mb-3">
        <img
          src={product.image || '/placeholder-image.svg'}
          alt={product.name}
          className="w-12 h-12 object-cover rounded mr-3"
          onError={(e) => { e.target.src = '/placeholder-image.svg'; }}
        />
        <div>
          <h4 className="font-medium text-gray-800">{product.name}</h4>
          <p className="text-green-600 font-semibold">{typeof product.price === 'number' ? product.price.toLocaleString() : product.price} 원</p>
        </div>
      </div>
      {product.reviews && product.reviews.map((review, index) => (
        <p key={index} className="text-sm text-gray-700 mb-2 border-l-4 border-gray-300 pl-3">{review.text}</p>
      ))}
    </div>
  );
};

export default ProductDisplay;
