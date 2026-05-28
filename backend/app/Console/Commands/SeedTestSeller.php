<?php

namespace App\Console\Commands;

use App\Models\Client;
use App\Models\Seller;
use Illuminate\Console\Command;

class SeedTestSeller extends Command
{
    protected $signature = 'seller:seed-test
        {--name= : Nombre del vendedor}
        {--phone= : Teléfono / WhatsApp}
        {--email= : Email de contacto}
        {--code= : Código interno}
        {--assign=unassigned : unassigned|first5|all|none}';

    protected $description = 'Crea (o reusa) un vendedor de prueba y le asigna clientes.';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Nombre del vendedor', 'Oscar Hernandez');
        $phone = $this->option('phone') ?: $this->ask('Teléfono', '3117580698');
        $email = $this->option('email') ?: ('vendedor.'.strtolower(str_replace(' ', '.', $name)).'@gruposantacruz.com');
        $code = $this->option('code') ?: ('V-'.strtoupper(substr(md5($name), 0, 6)));

        $seller = Seller::firstOrCreate(
            ['email' => $email],
            [
                'code' => $code,
                'name' => $name,
                'phone' => $phone,
                'whatsapp' => $phone,
                'active' => true,
            ]
        );

        if (! $seller->wasRecentlyCreated) {
            $seller->update([
                'name' => $name,
                'phone' => $phone,
                'whatsapp' => $phone,
                'active' => true,
            ]);
            $this->info("Vendedor existente actualizado: {$seller->name} (id {$seller->id})");
        } else {
            $this->info("Vendedor creado: {$seller->name} (id {$seller->id})");
        }

        $strategy = $this->option('assign');
        $query = match ($strategy) {
            'all' => Client::query(),
            'first5' => Client::query()->orderBy('id')->limit(5),
            'none' => null,
            default => Client::query()->whereNull('seller_id'),
        };

        if ($query) {
            $count = (clone $query)->count();
            $query->update(['seller_id' => $seller->id]);
            $this->info("Clientes asignados: {$count}");
        } else {
            $this->info('No se asignaron clientes (estrategia=none).');
        }

        $this->newLine();
        $this->line("→ Cuando un cliente se conecte por el chat y proporcione un NIT registrado a este vendedor,");
        $this->line("  la conversación se enrutará a ti. Tómala desde /admin/chats para responder.");

        return self::SUCCESS;
    }
}
