<?php
class Settings_model extends CI_Model {

    public function get_all() {
        $query = $this->db->get('settings')->result_array();
        $settings = [];
        foreach ($query as $row) {
            $settings[$row['key']] = $row['value'];
        }
        return $settings;
    }

    public function get_value($key) {
        $this->db->where('key', $key);
        $query = $this->db->get('settings')->row_array();
        return $query ? $query['value'] : NULL;
    }

    /**
     * Update banyak pengaturan sekaligus
     * @param array $data ['nama_toko' => 'PrintPro', 'alamat' => '...']
     */
    public function update_batch($data) {
        foreach ($data as $key => $value) {
            // Menggunakan REPLACE INTO agar jika key sudah ada akan diupdate, jika belum akan diinsert
            $sql = "REPLACE INTO settings (`key`, `value`) VALUES (?, ?)";
            $this->db->query($sql, array($key, $value));
        }
        return TRUE;
    }
}