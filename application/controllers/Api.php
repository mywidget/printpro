<?php
	defined('BASEPATH') OR exit('No direct script access allowed');
	
	class Api extends CI_Controller {
		
		public function __construct() {
			parent::__construct();
			header('Access-Control-Allow-Origin: *');
			header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, PATCH, DELETE");
			header("Access-Control-Allow-Headers: Content-Type, Content-Length, Accept-Encoding, Authorization");
			
			if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
				exit;
			}
			
			$this->load->database();
			$this->load->model('order_model');
			$this->load->model('product_model');
			$this->load->model('inventory_model');
			$this->load->model('customer_model');
			$this->load->model('settings_model');
		}
		
		private function _json($data, $code = 200) {
			$this->output
            ->set_content_type('application/json')
            ->set_status_header($code)
            ->set_output(json_encode($data));
		}
		/**
			* Helper untuk input JSON (Pengganti getJSON CI4)
		*/
		private function _get_json() {
			return json_decode(file_get_contents('php://input'), true);
		}
		// ==========================================
		// AUTHENTICATION (LOGIN)
		// ==========================================
		public function login() {
			if ($this->input->method() !== 'post') return $this->_json(['message' => 'Method not allowed'], 405);
			
			$json = $this->_get_json();
			$username = $json['username'] ?? '';
			$password = $json['password'] ?? '';
			
			$user = $this->db->where('username', $username)->get('users')->row_array();
			
			if ($user && password_verify($password, $user['password'])) {
				$this->db->where('id', $user['id'])->update('users', ['last_login' => date('Y-m-d H:i:s')]);
				unset($user['password']);
				return $this->_json($user);
			}
			
			return $this->_json(['message' => 'Username atau Password salah'], 401);
		}
		
		// ==========================================
		// USER MANAGEMENT
		// ==========================================
		public function users($id = null) {
			$method = $this->input->method();
			
			if ($method === 'get') {
				$data = $this->db->select('id, username, name, role, last_login')->get('users')->result();
				return $this->_json($data);
			}
			
			if ($method === 'post') {
				$json = $this->_get_json();
				$data = [
                'username' => $json['username'],
                'name'     => $json['name'],
                'role'     => $json['role'] ?? 'STAFF'
				];
				
				if (!empty($json['password'])) {
					$data['password'] = password_hash($json['password'], PASSWORD_DEFAULT);
				}
				
				$exists = $this->db->where('id', $json['id'])->get('users')->num_rows();
				if ($exists > 0) {
					$this->db->where('id', $json['id'])->update('users', $data);
					} else {
					$data['id'] = $json['id'];
					$this->db->insert('users', $data);
				}
				return $this->_json(['status' => 'ok']);
			}
			
			if ($method === 'delete' && $id) {
				if ($id === 'u-admin') return $this->_json(['message' => 'Admin utama tidak bisa dihapus'], 403);
				$this->db->where('id', $id)->delete('users');
				return $this->_json(['status' => 'deleted']);
			}
		}
		
		/**
			* SINKRONISASI MASAL (Push to Server)
		*/
		public function sync() {
			if ($this->input->method() !== 'post') {
				$this->_json(['message' => 'Hanya POST'], 405);
				return;
			}
			
			$json = json_decode(file_get_contents('php://input'), true);
			if (!$json) {
				$this->_json(['message' => 'JSON tidak valid'], 400);
				return;
			}
			
			$this->db->trans_start();
			
			// 1. Sinkron Kategori (Upsert Pattern)
			if (!empty($json['categories'])) {
				foreach ($json['categories'] as $cat) {
					$data = [
                    'id'          => $cat['id'],
                    'name'        => $cat['name'],
                    'description' => $cat['description'] ?? ''
					];
					$exists = $this->db->where('id', $cat['id'])->get('categories')->num_rows();
					if ($exists > 0) $this->db->where('id', $cat['id'])->update('categories', $data);
					else $this->db->insert('categories', $data);
				}
			}
			
			// 2. Sinkron Produk
			if (!empty($json['products'])) {
				foreach ($json['products'] as $p) {
					$data = [
                    'id'           => $p['id'],
                    'name'         => $p['name'],
                    'category_id'  => $p['categoryId'],
                    'pricing_type' => $p['pricingType'],
                    'base_price'   => $p['basePrice'],
                    'cost_price'   => $p['costPrice'],
                    'unit'         => $p['unit'],
                    'description'  => $p['description'],
                    'price_ranges' => isset($p['priceRanges']) ? json_encode($p['priceRanges']) : '[]',
                    'materials'    => isset($p['materials']) ? json_encode($p['materials']) : '[]'
					];
					$exists = $this->db->where('id', $p['id'])->get('products')->num_rows();
					if ($exists > 0) $this->db->where('id', $p['id'])->update('products', $data);
					else $this->db->insert('products', $data);
				}
			}
			
			// 3. Sinkron Inventori
			if (!empty($json['inventory'])) {
				foreach ($json['inventory'] as $inv) {
					$data = [
                    'id'        => $inv['id'],
                    'name'      => $inv['name'],
                    'category'  => $inv['category'],
                    'stock'     => $inv['stock'],
                    'min_stock' => $inv['minStock'],
                    'unit'      => $inv['unit']
					];
					$exists = $this->db->where('id', $inv['id'])->get('inventory')->num_rows();
					if ($exists > 0) $this->db->where('id', $inv['id'])->update('inventory', $data);
					else $this->db->insert('inventory', $data);
				}
			}
			
			// 4. Sinkron Pelanggan
			if (!empty($json['customers'])) {
				foreach ($json['customers'] as $c) {
					$data = [
                    'id'           => $c['id'],
                    'name'         => $c['name'],
                    'phone'        => $c['phone'],
                    'email'        => $c['email'] ?? '',
                    'total_orders' => $c['totalOrders'],
                    'total_spent'  => $c['totalSpent'],
                    'join_date'    => $c['joinDate']
					];
					$exists = $this->db->where('id', $c['id'])->get('customers')->num_rows();
					if ($exists > 0) $this->db->where('id', $c['id'])->update('customers', $data);
					else $this->db->insert('customers', $data);
				}
			}
			
			// 5. Sinkron Pesanan
			if (!empty($json['orders'])) {
				foreach ($json['orders'] as $o) {
					$data = [
                    'id'             => $o['id'],
                    'customer_name'  => $o['customerName'],
                    'customer_phone' => $o['customerPhone'],
                    'status'         => $o['status'],
                    'total_amount'   => $o['totalAmount'],
                    'paid_amount'    => $o['paidAmount'],
                    'payment_method' => $o['paymentMethod'],
                    'created_at'     => $o['createdAt'],
                    'items_json'     => json_encode($o['items'])
					];
					$exists = $this->db->where('id', $o['id'])->get('orders')->num_rows();
					if ($exists > 0) $this->db->where('id', $o['id'])->update('orders', $data);
					else $this->db->insert('orders', $data);
				}
			}
			
			$this->db->trans_complete();
			if ($this->db->trans_status() === FALSE) {
				$this->_json(['message' => 'Gagal sinkronisasi database'], 500);
				} else {
				$this->_json(['status' => 'ok', 'message' => 'Sinkronisasi berhasil!']);
			}
		}
		
		/**
			* ENDPOINT KATEGORI
		*/
		public function categories($id = null) {
			$method = $this->input->method();
			
			if ($method === 'get') {
				if ($id) {
					$data = $this->db->where('id', $id)->get('categories')->row();
					} else {
					$data = $this->db->get('categories')->result();
				}
				$this->_json($data);
				return;
			} 
			
			if ($method === 'post') {
				$json = json_decode(file_get_contents('php://input'), true);
				if (!$json || !isset($json['id'])) {
					$this->_json(['message' => 'ID Kategori wajib diisi'], 400);
					return;
				}
				
				$data = [
                'id'          => $json['id'],
                'name'        => $json['name'],
                'description' => $json['description'] ?? ''
				];
				
				// Cek keberadaan data untuk menghindari error FK constraint
				$exists = $this->db->where('id', $json['id'])->get('categories')->num_rows();
				
				if ($exists > 0) {
					$this->db->where('id', $json['id'])->update('categories', $data);
					$this->_json(['status' => 'updated']);
					} else {
					$this->db->insert('categories', $data);
					$this->_json(['status' => 'created'], 201);
				}
				return;
			}
			
			if ($method === 'delete' && $id) {
				$this->db->where('id', $id)->delete('categories');
				$this->_json(['status' => 'deleted']);
			}
		}
		
		/**
			* ENDPOINT PRODUK
		*/
		public function products() {
			if ($this->input->method() === 'get') {
				$data = $this->db->get('products')->result();
				// Decode JSON string kembali ke object untuk React
				foreach ($data as &$p) {
					$p->price_ranges = json_decode($p->price_ranges);
					$p->materials = json_decode($p->materials);
				}
				$this->_json($data);
			}
		}
		
		// ==========================================
		// ORDERS
		// ==========================================
		public function orders($id = null) {
			$method = $this->input->method();
			
			if ($method === 'get') {
				$data = $this->db->order_by('created_at', 'DESC')->get('orders')->result();
				return $this->_json($data);
			}
			
			if ($method === 'post') {
				$json = $this->_get_json();
				$data = [
                'customer_name'  => $json['customerName'] ?? '',
                'customer_phone' => $json['customerPhone'] ?? '',
                'status'         => $json['status'] ?? 'PENDING',
                'total_amount'   => $json['totalAmount'] ?? 0,
                'paid_amount'    => $json['paidAmount'] ?? 0,
                'payment_method' => $json['paymentMethod'] ?? 'CASH',
                'items_json'     => json_encode($json['items'] ?? [])
				];
				
				$exists = $this->db->where('id', $json['id'])->get('orders')->num_rows();
				if ($exists > 0) {
					$this->db->where('id', $json['id'])->update('orders', $data);
					} else {
					$data['id'] = $json['id'];
					$data['created_at'] = date('Y-m-d H:i:s');
					$this->db->insert('orders', $data);
				}
				return $this->_json(['status' => 'ok']);
			}
		}
		
		public function inventory() { $this->_json($this->db->get('inventory')->result()); }
		public function customers() { $this->_json($this->db->get('customers')->result()); }
		public function settings() {
			$method = $this->input->method();
			
			if ($method === 'get') {
				$res = $this->db->get('settings')->result();
				$data = [];
				foreach($res as $r) { $data[$r->key] = $r->value; }
				$this->_json($data);
			} 
			elseif ($method === 'post') {
				// Mengambil input JSON dari React
				$json = json_decode(file_get_contents('php://input'), true);
				
				foreach ($json as $key => $val) {
					// Gunakan REPLACE INTO agar jika key sudah ada, nilainya diupdate
					$this->db->query("REPLACE INTO settings (`key`, `value`) VALUES (?, ?)", [$key, $val]);
				}
				
				$this->_json(['status' => 'ok', 'message' => 'Pengaturan berhasil disimpan']);
			}
		}
	}						