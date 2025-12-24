<?php
	defined('BASEPATH') OR exit('No direct script access allowed');
	
	class Product_model extends CI_Model {
		
		public function __construct() {
			parent::__construct();
			$this->load->database();
		}
		
		public function get_all() {
			$this->db->select('products.*, categories.name as category_name');
			$this->db->from('products');
			$this->db->join('categories', 'categories.id = products.category_id', 'left');
			$products = $this->db->get()->result_array();
			
			foreach ($products as &$product) {
				// Ambil Range Harga (Grosir)
				$product['price_ranges'] = $this->db->get_where('price_ranges', 
                array('product_id' => $product['id']))->result_array();
				
				// Ambil Bahan Baku Terkait (Jika ada)
				$product['materials'] = $this->db->select('product_materials.*, materials.name as material_name')
                ->from('product_materials')
                ->join('materials', 'materials.id = product_materials.material_id')
                ->where('product_id', $product['id'])
                ->get()->result_array();
			}
			return $products;
		}
	}	