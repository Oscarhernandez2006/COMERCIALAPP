<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Usuario administrador (lo único imprescindible para entrar al panel)
        User::updateOrCreate(
            ['email' => 'admin@gruposantacruz.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('admin1234'),
            ],
        );

        // Ajustes base del portal (todo editable desde el panel)
        $settings = [
            ['key' => 'site_name',          'value' => 'Grupo Santacruz',                 'group' => 'general'],
            ['key' => 'site_tagline',       'value' => 'Portal de clientes',              'group' => 'general'],
            ['key' => 'site_description',   'value' => '',                                'group' => 'general'],

            ['key' => 'hero_eyebrow',       'value' => 'Bienvenido',                      'group' => 'hero'],
            ['key' => 'hero_title',         'value' => 'Productos que impulsan tu negocio.', 'group' => 'hero'],
            ['key' => 'hero_description',   'value' => '',                                'group' => 'hero'],
            ['key' => 'hero_cta_primary',   'value' => 'Explorar catálogo',               'group' => 'hero'],
            ['key' => 'hero_cta_secondary', 'value' => 'Hablar con un vendedor',          'group' => 'hero'],

            ['key' => 'contact_phone',      'value' => '',                                'group' => 'contact'],
            ['key' => 'contact_email',      'value' => '',                                'group' => 'contact'],
            ['key' => 'contact_address',    'value' => '',                                'group' => 'contact'],
            ['key' => 'contact_hours',      'value' => '',                                'group' => 'contact'],

            ['key' => 'social_facebook',    'value' => '',                                'group' => 'social'],
            ['key' => 'social_instagram',   'value' => '',                                'group' => 'social'],
            ['key' => 'social_linkedin',    'value' => '',                                'group' => 'social'],

            ['key' => 'logo_path',          'value' => null,                              'group' => 'general'],

            // Apariencia (editable desde /admin/apariencia)
            ['key' => 'theme_brand',           'value' => '#53AC30', 'group' => 'theme'],
            ['key' => 'theme_brand_hover',     'value' => '#468F28', 'group' => 'theme'],
            ['key' => 'theme_brand_soft',      'value' => '#EAF6E4', 'group' => 'theme'],
            ['key' => 'theme_brand_dark',      'value' => '#2F6B1C', 'group' => 'theme'],
            ['key' => 'theme_ink',             'value' => '#0A0A0A', 'group' => 'theme'],
            ['key' => 'theme_ink_soft',        'value' => '#525252', 'group' => 'theme'],
            ['key' => 'theme_bg',              'value' => '#FFFFFF', 'group' => 'theme'],
            ['key' => 'theme_muted',           'value' => '#F5F5F5', 'group' => 'theme'],
            ['key' => 'theme_border',          'value' => '#E5E5E5', 'group' => 'theme'],
            ['key' => 'theme_destructive',     'value' => '#DC2626', 'group' => 'theme'],
            ['key' => 'theme_font_family',     'value' => 'Inter',   'group' => 'theme'],
            ['key' => 'theme_font_size_base',  'value' => '16',      'group' => 'theme'],
            ['key' => 'theme_heading_scale',   'value' => '1.25',    'group' => 'theme'],
            ['key' => 'theme_heading_weight',  'value' => '800',     'group' => 'theme'],
            ['key' => 'theme_radius',          'value' => '0.75',    'group' => 'theme'],
            ['key' => 'theme_logo_size',       'value' => '36',      'group' => 'theme'],
            ['key' => 'theme_logo_text_size',  'value' => '15',      'group' => 'theme'],
        ];
        foreach ($settings as $s) {
            SiteSetting::updateOrCreate(['key' => $s['key']], $s);
        }

        $this->call(SellersAndClientsSeeder::class);
    }
}
