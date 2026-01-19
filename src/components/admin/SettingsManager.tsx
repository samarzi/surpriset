import { useEffect, useMemo, useState } from 'react';
import { Save, Database, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { settingsService } from '@/lib/database';
import type { Json } from '@/lib/supabase';

type SocialLinks = {
  telegram: string;
  instagram: string;
  vk: string;
};

type SeoSettings = {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
};

const defaultSocialLinks: SocialLinks = {
  telegram: '',
  instagram: '',
  vk: ''
};

const defaultSeoSettings: SeoSettings = {
  metaTitle: 'SurpriSet - Подарки с душой',
  metaDescription: 'Готовые подарочные наборы и возможность создать индивидуальный подарок',
  keywords: 'подарки, наборы, индивидуальные подарки'
};

function parseSocialLinks(value: Json | undefined): SocialLinks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultSocialLinks;
  }

  const record = value as Record<string, unknown>;
  return {
    telegram: typeof record.telegram === 'string' ? record.telegram : '',
    instagram: typeof record.instagram === 'string' ? record.instagram : '',
    vk: typeof record.vk === 'string' ? record.vk : ''
  };
}

function parseSeoSettings(value: Json | undefined): SeoSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultSeoSettings;
  }

  const record = value as Record<string, unknown>;
  return {
    metaTitle: typeof record.metaTitle === 'string' ? record.metaTitle : defaultSeoSettings.metaTitle,
    metaDescription: typeof record.metaDescription === 'string' ? record.metaDescription : defaultSeoSettings.metaDescription,
    keywords: typeof record.keywords === 'string' ? record.keywords : defaultSeoSettings.keywords,
  };
}

export function SettingsManager() {
  const defaultSettings = useMemo(() => ({
    id: undefined as string | undefined,
    siteName: 'SurpriSet',
    siteDescription: 'Подарки с душой',
    contactEmail: 'info@surpriset.ru',
    contactPhone: '+7 (999) 123-45-67',
    address: 'Москва, Россия',
    socialLinks: defaultSocialLinks,
    seoSettings: defaultSeoSettings,
  }), []);

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setInitializing(true);
      try {
        const data = await settingsService.get();
        if (data && isMounted) {
          setSettings({
            id: data.id,
            siteName: data.site_name,
            siteDescription: data.site_description,
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone,
            address: data.address,
            socialLinks: parseSocialLinks(data.social_links as Json | undefined),
            seoSettings: parseSeoSettings(data.seo_settings as Json | undefined)
          });
        } else if (!data && isMounted) {
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Failed to load settings', error);
        toast.error('Не удалось загрузить настройки');
        if (isMounted) {
          setSettings(defaultSettings);
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [defaultSettings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        id: settings.id,
        site_name: settings.siteName,
        site_description: settings.siteDescription,
        contact_email: settings.contactEmail,
        contact_phone: settings.contactPhone,
        address: settings.address,
        social_links: settings.socialLinks as Json,
        seo_settings: settings.seoSettings as Json
      };

      const result = await settingsService.upsert(payload);

      setSettings(prev => ({
        ...prev,
        id: result.id,
        siteName: result.site_name,
        siteDescription: result.site_description,
        contactEmail: result.contact_email,
        contactPhone: result.contact_phone,
        address: result.address,
        socialLinks: parseSocialLinks(result.social_links as Json | undefined),
        seoSettings: parseSeoSettings(result.seo_settings as Json | undefined)
      }));

      toast.success('Настройки сохранены');
    } catch (error) {
      console.error('Failed to save settings', error);
      toast.error('Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    toast.info('Экспорт данных начат...');
    // Здесь будет логика экспорта данных
  };

  const handleImportData = () => {
    toast.info('Выберите файл для импорта...');
    // Здесь будет логика импорта данных
  };

  const handleClearCache = () => {
    if (confirm('Вы уверены, что хотите очистить кэш?')) {
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Кэш очищен');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Настройки системы</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Основные настройки */}
        <Card>
          <CardHeader>
            <CardTitle>Основные настройки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Название сайта</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                disabled={initializing || loading}
              />
            </div>

            <div>
              <Label htmlFor="siteDescription">Описание сайта</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                disabled={initializing || loading}
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Email для связи</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                disabled={initializing || loading}
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Телефон</Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone}
                onChange={(e) => setSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                disabled={initializing || loading}
              />
            </div>

            <div>
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                disabled={initializing || loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO настройки */}
        <Card>
          <CardHeader>
            <CardTitle>SEO настройки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={settings.seoSettings.metaTitle}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  seoSettings: { ...prev.seoSettings, metaTitle: e.target.value }
                }))}
                disabled={initializing || loading}
              />
            </div>

            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={settings.seoSettings.metaDescription}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  seoSettings: { ...prev.seoSettings, metaDescription: e.target.value }
                }))}
                rows={3}
                disabled={initializing || loading}
              />
            </div>

            <div>
              <Label htmlFor="keywords">Ключевые слова</Label>
              <Input
                id="keywords"
                value={settings.seoSettings.keywords}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  seoSettings: { ...prev.seoSettings, keywords: e.target.value }
                }))}
                placeholder="подарки, наборы, индивидуальные подарки"
                disabled={initializing || loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Социальные сети */}
        <Card>
          <CardHeader>
            <CardTitle>Социальные сети</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                value={settings.socialLinks.telegram}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, telegram: e.target.value }
                }))}
                placeholder="@surpriset"
                disabled={initializing || loading}
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={settings.socialLinks.instagram}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                }))}
                placeholder="@surpriset"
                disabled={initializing || loading}
              />
            </div>

            <div>
              <Label htmlFor="vk">VKontakte</Label>
              <Input
                id="vk"
                value={settings.socialLinks.vk}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, vk: e.target.value }
                }))}
                placeholder="surpriset"
                disabled={initializing || loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Управление данными */}
        <Card>
          <CardHeader>
            <CardTitle>Управление данными</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button onClick={handleExportData} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Экспорт данных
              </Button>
              
              <Button onClick={handleImportData} variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Импорт данных
              </Button>
              
              <Button onClick={handleClearCache} variant="outline" className="gap-2">
                <Database className="h-4 w-4" />
                Очистить кэш
              </Button>
              
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Сброс настроек
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Кнопка сохранения */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </div>
    </div>
  );
}