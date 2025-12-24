<?php
	defined('BASEPATH') OR exit('No direct script access allowed');
	
	class Category_model extends CI_Model {
		
		public function __construct() {
			parent::__construct();
			$this->load->database();
		}
		
		public function get_all() {
			return $this->db->get('categories')->result_array();
		}
		
		public function insert($data) {
			return $this->db->insert('categories', $data);
		}
		
		public function update($id, $data) {
			$this->db->where('id', $id);
			return $this->db->update('categories', $data);
		}
		
		public function delete($id) {
			$this->db->where('id', $id);
			return $this->db->delete('categories');
		}
	}	