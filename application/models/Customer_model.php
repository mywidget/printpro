<?php
class Customer_model extends CI_Model {

    public function get_all() {
        // Menampilkan pelanggan dengan total belanja terbanyak di atas
        $this->db->order_by('total_spent', 'DESC');
        return $this->db->get('customers')->result_array();
    }

    public function get_by_phone($phone) {
        return $this->db->get_where('customers', ['phone' => $phone])->row_array();
    }

    /**
     * Update statistik pelanggan setelah order selesai
     */
    public function sync_from_order($data) {
        $existing = $this->get_by_phone($data['phone']);
        
        if ($existing) {
            $this->db->set('total_orders', 'total_orders + 1', FALSE);
            $this->db->set('total_spent', 'total_spent + ' . (float)$data['amount'], FALSE);
            $this->db->where('phone', $data['phone']);
            return $this->db->update('customers');
        } else {
            return $this->db->insert('customers', [
                'name' => $data['name'],
                'phone' => $data['phone'],
                'total_orders' => 1,
                'total_spent' => $data['amount'],
                'join_date' => date('Y-m-d H:i:s')
            ]);
        }
    }
}