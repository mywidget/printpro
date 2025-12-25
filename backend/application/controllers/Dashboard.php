<?php
	defined('BASEPATH') OR exit('No direct script access allowed');
	
	class Dashboard extends CI_Controller {
		
		public function __construct() {
			parent::__construct();
			// Tambahkan authentication check di sini
			// if (!$this->session->userdata('logged_in')) {
				// redirect('auth/login');
			// }
		}
		
		public function index() {
			$data = array(
            'title' => 'Dashboard - Xpress Desktop',
            'page_title' => 'Dashboard',
            'breadcrumbs' => array('Home', 'Dashboard'),
            'content' => 'dashboard/index'
			);
			
			$this->load->view('templates/main_layout', $data);
		}
	}	