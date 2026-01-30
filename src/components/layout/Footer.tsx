import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-6 lg:col-span-2">
            <Logo variant="white" size="md" showText={true} />
            <p className="text-gray-300 text-lg leading-relaxed max-w-md">
              Сервис готовых подарков с возможностью сборки индивидуальных наборов. 
              Делаем подарки особенными и запоминающимися.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Сделано с</span>
              <Heart className="h-4 w-4 text-red-400 fill-current" />
              <span>в России</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl">Навигация</h3>
            <ul className="space-y-3">
              {[
                { name: 'Главная', href: '/' },
                { name: 'Каталог', href: '/catalog' },
                { name: 'Профиль', href: '/profile' },
              ].map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.href} 
                    className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl">Контакты</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <span className="text-gray-300">+7 (999) 123-45-67</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <span className="text-gray-300">hello@surpriset.ru</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span className="text-gray-300">Москва, Россия</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-400 text-center md:text-left">
            © 2024 SurpriSet. Все права защищены.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-6">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300">
              Политика конфиденциальности
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-300">
              Условия использования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}