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
		public function index()
		{
			$this->load->view('welcome_message');
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
		// BRANCH MANAGEMENT (NEW)
		// ==========================================
		public function branches($id = null) {
			$method = $this->input->method();
			
			if ($method === 'get') {
				$data = $id ? $this->db->where('id', $id)->get('branches')->row() : $this->db->get('branches')->result();
				return $this->_json($data);
			}
			
			if ($method === 'post') {
				$json = $this->_get_json();
				$data = [
                'name'    => $json['name'],
                'address' => $json['address'],
                'phone'   => $json['phone'],
                'is_main_branch' => isset($json['isMainBranch']) ? ($json['isMainBranch'] ? 1 : 0) : 0
				];
				
				$exists = $this->db->where('id', $json['id'])->get('branches')->num_rows();
				if ($exists > 0) {
					$this->db->where('id', $json['id'])->update('branches', $data);
					} else {
					$data['id'] = $json['id'];
					$this->db->insert('branches', $data);
				}
				return $this->_json(['status' => 'ok']);
			}
			
			if ($method === 'delete' && $id) {
				$this->db->where('id', $id)->delete('branches');
				return $this->_json(['status' => 'deleted']);
			}
		}
		
		// ==========================================
		// USER MANAGEMENT
		// ==========================================
		public function users($id = null) {
			$method = $this->input->method();
			
			if ($method === 'get') {
				$data = $this->db->select('id, username, name, role, branch_id, last_login')->get('users')->result();
				return $this->_json($data);
			}
			
			if ($method === 'post') {
				$json = $this->_get_json();
				$data = [
                'username'  => $json['username'],
                'name'      => $json['name'],
                'role'      => $json['role'] ?? 'STAFF',
                'branch_id' => $json['branchId'] ?? null // FK ke cabang
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
		
		// ==========================================
		// PRODUCTS
		// ==========================================
		public function products($id = null) {
			$method = $this->input->method();
			
			if ($method === 'get') {
				$data = $this->db->get('products')->result();
				foreach ($data as &$p) {
					$p->price_ranges = json_decode($p->price_ranges);
					$p->materials = json_decode($p->materials);
				}
				return $this->_json($data);
			}
			
			if ($method === 'post') {
				$json = $this->_get_json();
				$data = [
				'name'         => $json['name'],
				'category_id'  => $json['category_id'],
				'pricing_type' => $json['pricing_type'],
				'base_price'   => $json['base_price'],
				'cost_price'   => $json['cost_price'],
				'unit'         => $json['unit'],
				'description'  => $json['description'] ?? '',
				'price_ranges' => json_encode($json['price_ranges'] ?? []),
				'materials'    => json_encode($json['materials'] ?? [])
				];
				
				$exists = $this->db->where('id', $json['id'])->get('products')->num_rows();
				if ($exists > 0) {
					$this->db->where('id', $json['id'])->update('products', $data);
					} else {
					$data['id'] = $json['id'];
					$this->db->insert('products', $data);
				}
				return $this->_json(['status' => 'ok']);
			}
			
			if ($method === 'delete' && $id) {
				$this->db->where('id', $id)->delete('products');
				return $this->_json(['status' => 'deleted']);
			}
		}
		
		// ==========================================
		// CUSTOMERS
		// ==========================================
		public function customers($id = null) {
			$method = $this->input->method();
			
			if ($method === 'get') {
				return $this->_json($this->db->get('customers')->result());
			}
			
			if ($method === 'post') {
				$json = $this->_get_json();
				$data = [
				'name'         => $json['name'],
				'phone'        => $json['phone'],
				'email'        => $json['email'] ?? '',
				'total_orders' => $json['total_orders'] ?? 0,
				'total_spent'  => $json['total_spent'] ?? 0,
				'join_date'    => $json['join_date'] ?? date('Y-m-d H:i:s')
				];
				
				$exists = $this->db->where('id', $json['id'])->get('customers')->num_rows();
				if ($exists > 0) {
					$this->db->where('id', $json['id'])->update('customers', $data);
					} else {
					$data['id'] = $json['id'];
					$this->db->insert('customers', $data);
				}
				return $this->_json(['status' => 'ok']);
			}
		}
		
		
		
		// ==========================================
		// ORDERS (Filtered by Branch)
		// ==========================================
		public function orders($id = null) {
			$method = $this->input->method();
			
			if ($method === 'get') {
				$branch_id = $this->input->get('branchId');
				if ($branch_id) {
					$this->db->where('branch_id', $branch_id);
				}
				$data = $this->db->order_by('created_at', 'DESC')->get('orders')->result();
				return $this->_json($data);
			}
			
			if ($method === 'post') {
				$json = $this->_get_json();
				$data = [
                'branch_id'      => $json['branchId'] ?? $json['branch_id'],
                'customer_name'  => $json['customerName'] ?? $json['customer_name'],
                'customer_phone' => $json['customerPhone'] ?? $json['customer_phone'],
                'status'         => $json['status'] ?? 'PENDING',
                'total_amount'   => $json['totalAmount'] ?? $json['total_amount'],
                'paid_amount'    => $json['paidAmount'] ?? $json['paid_amount'],
                'payment_method' => $json['paymentMethod'] ?? $json['payment_method'],
                'items_json'     => isset($json['items']) ? json_encode($json['items']) : $json['items_json'],
                'notes'          => $json['notes'] ?? ''
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
		
		
		// ==========================================
		// INVENTORY (Filtered by Branch)
		// ==========================================
		public function inventory($id = null) {
			$method = $this->input->method();
			
			if ($method === 'get') {
				$branch_id = $this->input->get('branchId');
				if ($branch_id) {
					$this->db->where('branch_id', $branch_id);
				}
				return $this->_json($this->db->get('inventory')->result());
			}
			
			if ($method === 'post') {
				$json = $this->_get_json();
				$data = [
                'branch_id' => $json['branchId'] ?? $json['branch_id'],
                'name'      => $json['name'],
                'category'  => $json['category'],
                'stock'     => $json['stock'],
                'min_stock' => $json['min_stock'] ?? $json['minStock'],
                'unit'      => $json['unit']
				];
				
				$exists = $this->db->where('id', $json['id'])->get('inventory')->num_rows();
				if ($exists > 0) {
					$this->db->where('id', $json['id'])->update('inventory', $data);
					} else {
					$data['id'] = $json['id'];
					$this->db->insert('inventory', $data);
				}
				return $this->_json(['status' => 'ok']);
			}
			
			if ($method === 'delete' && $id) {
				$this->db->where('id', $id)->delete('inventory');
				return $this->_json(['status' => 'deleted']);
			}
		}
		
		public function settings()
		{
			$method = $this->input->method(); // CI3 Way
			
			if ($method === 'get') {
				// Ambil data dari tabel settings
				$res = $this->db->get('settings')->result();
				$data = [];
				foreach ($res as $r) {
					$data[$r->key] = $r->value;
				}
				
				return $this->output
				->set_content_type('application/json')
				->set_status_header(200)
				->set_output(json_encode([
                'success' => true,
                'data'    => $data
				]));
			} 
			
			if ($method === 'post') {
				// Mengambil input JSON dari body request (Standard CI3/PHP)
				$json = json_decode(file_get_contents('php://input'), true);
				
				if (empty($json)) {
					return $this->output
					->set_content_type('application/json')
					->set_status_header(400)
					->set_output(json_encode([
                    'success' => false, 
                    'message' => 'Data kosong'
					]));
				}
				
				foreach ($json as $key => $val) {
					// Mapping: fonnteToken (React) -> fonnte_token (DB)
					$dbKey = ($key === 'fonnteToken') ? 'fonnte_token' : $key;
					
					// Konversi array/object ke JSON string jika perlu
					$dbValue = (is_array($val) || is_object($val)) ? json_encode($val) : $val;
					
					// Update atau Insert (REPLACE INTO)
					$this->db->query("REPLACE INTO settings (`key`, `value`) VALUES (?, ?)", [$dbKey, $dbValue]);
				}
				
				return $this->output
				->set_content_type('application/json')
				->set_status_header(200)
				->set_output(json_encode([
                'success' => true, 
                'message' => 'Pengaturan berhasil diperbarui'
				]));
			}
		}
	}																			