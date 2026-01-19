import { useProducts, useBanners } from '../../hooks/useDatabase'
import { Card } from '../ui/card'
import { Button } from '../ui/button'

export function DatabaseExample() {
  const { products, loading: productsLoading, error: productsError } = useProducts({ 
    featured: true 
  })
  const { banners, loading: bannersLoading, error: bannersError } = useBanners(true)

  if (productsLoading || bannersLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Загрузка данных...</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (productsError || bannersError) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Ошибка подключения к базе данных</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 mb-2">
            {productsError || bannersError}
          </p>
          <p className="text-sm text-red-600">
            Убедитесь, что вы выполнили миграцию базы данных. 
            Инструкции в файле DATABASE_SETUP.md
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">🎉 База данных подключена!</h2>
        <p className="text-gray-600 mb-6">
          Данные успешно загружены из Supabase. Ниже примеры товаров и баннеров.
        </p>
      </div>

      {/* Banners Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Активные баннеры ({banners.length})</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className="p-4">
              <img 
                src={banner.image} 
                alt={banner.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Banner'
                }}
              />
              <h4 className="font-medium">{banner.title}</h4>
              <p className="text-sm text-gray-500">Порядок: {banner.order}</p>
              {banner.link && (
                <Button variant="outline" size="sm" className="mt-2">
                  Перейти
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Рекомендуемые товары ({products.length})</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="p-4">
              <img 
                src={product.images[0] || 'https://via.placeholder.com/300x200?text=Product'} 
                alt={product.name}
                className="w-full h-40 object-cover rounded-lg mb-3"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Product'
                }}
              />
              <div className="space-y-2">
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{product.price}₽</span>
                    {product.original_price && (
                      <span className="text-sm text-gray-500 line-through">
                        {product.original_price}₽
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.status === 'in_stock' 
                      ? 'bg-green-100 text-green-800' 
                      : product.status === 'coming_soon'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status === 'in_stock' ? 'В наличии' : 
                     product.status === 'coming_soon' ? 'Скоро' : 'Закончилось'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {product.type === 'bundle' ? '📦 Набор' : '🎁 Товар'}
                  </span>
                  <span className="text-xs text-gray-500">
                    SKU: {product.sku}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Database Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Информация о подключении</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>✅ Supabase подключен успешно</p>
          <p>📊 Товаров в базе: {products.length} (показаны только рекомендуемые)</p>
          <p>🎨 Активных баннеров: {banners.length}</p>
          <p>🔗 URL: https://rmcedkzodiqcxnpenjld.supabase.co</p>
        </div>
      </div>
    </div>
  )
}