<?php
class Order_model extends CI_Model {

    public function get_all($start = null, $end = null) {
        $this->db->select('o.*, c.name as customer_name');
        $this->db->from('orders o');
        $this->db->join('customers c', 'c.id = o.customer_id', 'left');
        
        if ($start && $end) {
            $this->db->where('o.created_at >=', $start . ' 00:00:00');
            $this->db->where('o.created_at <=', $end . ' 23:59:59');
        }
        
        $this->db->order_by('o.created_at', 'DESC');
        $orders = $this->db->get()->result_array();

        foreach ($orders as &$o) {
            $o['items'] = $this->db->get_where('order_items', ['order_id' => $o['id']])->result_array();
        }
        return $orders;
    }

    public function create($data) {
        $this->db->trans_start();

        // 1. Simpan/Update Customer
        $customer_id = null;
        if (!empty($data['customerPhone'])) {
            $cust = $this->db->get_where('customers', ['phone' => $data['customerPhone']])->row();
            if ($cust) {
                $customer_id = $cust->id;
                $this->db->where('id', $customer_id)->update('customers', [
                    'total_orders' => $cust->total_orders + 1,
                    'total_spent' => $cust->total_spent + $data['totalAmount']
                ]);
            } else {
                $this->db->insert('customers', [
                    'name' => $data['customerName'],
                    'phone' => $data['customerPhone'],
                    'total_orders' => 1,
                    'total_spent' => $data['totalAmount']
                ]);
                $customer_id = $this->db->insert_id();
            }
        }

        // 2. Insert Order
        $this->db->insert('orders', [
            'id' => $data['id'],
            'customer_id' => $customer_id,
            'customer_name' => $data['customerName'],
            'customer_phone' => $data['customerPhone'],
            'total_amount' => $data['totalAmount'],
            'paid_amount' => $data['paidAmount'],
            'payment_method' => $data['paymentMethod'],
            'status' => 'PENDING',
            'notes' => isset($data['notes']) ? $data['notes'] : ''
        ]);

        // 3. Insert Items & Potong Stok
        foreach ($data['items'] as $item) {
            $this->db->insert('order_items', [
                'order_id' => $data['id'],
                'product_id' => $item['productId'],
                'product_name' => $item['productName'],
                'quantity' => $item['quantity'],
                'width' => isset($item['width']) ? $item['width'] : 1,
                'height' => isset($item['height']) ? $item['height'] : 1,
                'unit_price' => $item['unitPrice'],
                'cost_price' => $item['costPrice'],
                'total_price' => $item['totalPrice']
            ]);

            // Ambil "resep" bahan baku produk ini
            $materials = $this->db->get_where('product_materials', ['product_id' => $item['productId']])->result();
            foreach ($materials as $m) {
                $volume = (isset($item['width']) ? $item['width'] * $item['height'] : 1) * $item['quantity'];
                $usage = $volume * $m->quantity_per_unit;
                
                // Query potong stok
                $this->db->set('stock', "stock - $usage", FALSE);
                $this->db->where('id', $m->material_id);
                $this->db->update('inventory');
            }
        }

        $this->db->trans_complete();
        return $this->db->trans_status();
    }

    public function update_status($id, $status) {
        // Logika pengembalian stok jika status jadi CANCELLED atau RETURNED 
        // bisa ditambahkan di sini mengikuti pola 'is_recoverable' yang kita bahas tadi.
        return $this->db->where('id', $id)->update('orders', ['status' => $status]);
    }

    public function get_dashboard_stats() {
        $today = date('Y-m-d');
        $revenue = $this->db->select_sum('total_amount')
                            ->where('DATE(created_at)', $today)
                            ->where_not_in('status', ['CANCELLED', 'RETURNED'])
                            ->get('orders')->row()->total_amount ?? 0;

        $pending = $this->db->where_not_in('status', ['DONE', 'CANCELLED', 'RETURNED'])->count_all_results('orders');
        $completed = $this->db->where('status', 'DONE')->where('DATE(created_at)', $today)->count_all_results('orders');

        return [
            'totalSales' => (int)$revenue,
            'pendingOrders' => $pending,
            'completedToday' => $completed,
            'revenueByDay' => [] // Bisa diisi dengan query grup by date 7 hari terakhir
        ];
    }
}