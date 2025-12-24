<?php
class Inventory_model extends CI_Model {

    public function get_all() {
        return $this->db->get('inventory')->result_array();
    }

    public function insert($data) {
        return $this->db->insert('inventory', $data);
    }

    public function update($id, $data) {
        $this->db->where('id', $id);
        return $this->db->update('inventory', $data);
    }

    public function delete($id) {
        $this->db->where('id', $id);
        return $this->db->delete('inventory');
    }

    /**
     * Fungsi khusus untuk tambah/kurang stok secara atomik
     * @param string $id ID Material
     * @param float $amount Jumlah (bisa positif untuk restock, negatif untuk pemakaian)
     */
    public function update_stock($id, $amount) {
        $this->db->set('stock', 'stock + ' . (float)$amount, FALSE);
        $this->db->where('id', $id);
        return $this->db->update('inventory');
    }
}