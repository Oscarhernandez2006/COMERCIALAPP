<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Seller;
use Illuminate\Database\Seeder;

class SellersAndClientsSeeder extends Seeder
{
    public function run(): void
    {
        $sellers = [
            ['code' => 'V001', 'name' => 'Carlos Pérez',    'phone' => '+57 300 111 2233', 'whatsapp' => '+57 300 111 2233', 'email' => 'carlos.perez@gruposantacruz.com', 'zone' => 'Norte'],
            ['code' => 'V002', 'name' => 'María Gómez',     'phone' => '+57 301 222 3344', 'whatsapp' => '+57 301 222 3344', 'email' => 'maria.gomez@gruposantacruz.com',  'zone' => 'Sur'],
            ['code' => 'V003', 'name' => 'Andrés Ramírez',  'phone' => '+57 302 333 4455', 'whatsapp' => '+57 302 333 4455', 'email' => 'andres.ramirez@gruposantacruz.com', 'zone' => 'Centro'],
        ];

        foreach ($sellers as $s) {
            Seller::updateOrCreate(['code' => $s['code']], $s + ['active' => true]);
        }

        // Cliente demo para probar el flujo "cliente existente"
        $carlos = Seller::where('code', 'V001')->first();
        if ($carlos) {
            Client::updateOrCreate(
                ['document_number' => '900123456'],
                [
                    'document_type' => 'NIT',
                    'name' => 'Agro Demo S.A.S.',
                    'phone' => '+57 310 555 6677',
                    'email' => 'contacto@agrodemo.com',
                    'address' => 'Calle 100 #15-20',
                    'city' => 'Bogotá',
                    'seller_id' => $carlos->id,
                    'source' => 'manual',
                    'synced_with_erp' => true,
                    'active' => true,
                ],
            );
        }
    }
}
