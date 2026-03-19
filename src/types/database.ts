export type UserRole = 'admin' | 'kasir'
export type SatuanType = 'pcs' | 'lusin' | 'kg' | 'meter' | 'pack'
export type MetodeBayar = 'tunai' | 'transfer' | 'qris' | 'debit'
export type StatusTransaksi = 'selesai' | 'batal'
export type JenisAdjustment = 'masuk' | 'keluar' | 'koreksi' | 'terjual'
export type StokStatus = 'aman' | 'menipis' | 'habis'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nama: string
          username: string
          role: UserRole | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          nama: string
          username: string
          role?: UserRole | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nama?: string
          username?: string
          role?: UserRole | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          nama: string
          deskripsi: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          nama: string
          deskripsi?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          nama?: string
          deskripsi?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: number
          sku: string | null
          barcode: string | null
          nama: string
          deskripsi: string | null
          category_id: number | null
          satuan: SatuanType | null
          harga_beli: number | null
          harga_jual: number
          stok: number | null
          stok_minimum: number | null
          foto_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          sku?: string | null
          barcode?: string | null
          nama: string
          deskripsi?: string | null
          category_id?: number | null
          satuan?: SatuanType | null
          harga_beli?: number | null
          harga_jual: number
          stok?: number | null
          stok_minimum?: number | null
          foto_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          sku?: string | null
          barcode?: string | null
          nama?: string
          deskripsi?: string | null
          category_id?: number | null
          satuan?: SatuanType | null
          harga_beli?: number | null
          harga_jual?: number
          stok?: number | null
          stok_minimum?: number | null
          foto_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: number
          nomor_nota: string
          kasir_id: string | null
          subtotal: number
          diskon_persen: number | null
          diskon_amount: number | null
          ppn_persen: number | null
          ppn_amount: number | null
          total: number
          metode_bayar: MetodeBayar
          uang_diterima: number | null
          kembalian: number | null
          catatan: string | null
          status: StatusTransaksi | null
          created_at: string | null
        }
        Insert: {
          id?: number
          nomor_nota: string
          kasir_id?: string | null
          subtotal: number
          diskon_persen?: number | null
          diskon_amount?: number | null
          ppn_persen?: number | null
          ppn_amount?: number | null
          total: number
          metode_bayar: MetodeBayar
          uang_diterima?: number | null
          kembalian?: number | null
          catatan?: string | null
          status?: StatusTransaksi | null
          created_at?: string | null
        }
        Update: {
          id?: number
          nomor_nota?: string
          kasir_id?: string | null
          subtotal?: number
          diskon_persen?: number | null
          diskon_amount?: number | null
          ppn_persen?: number | null
          ppn_amount?: number | null
          total?: number
          metode_bayar?: MetodeBayar
          uang_diterima?: number | null
          kembalian?: number | null
          catatan?: string | null
          status?: StatusTransaksi | null
          created_at?: string | null
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          id: number
          transaction_id: number | null
          product_id: number | null
          nama_produk: string
          harga_satuan: number
          qty: number
          subtotal: number
        }
        Insert: {
          id?: number
          transaction_id?: number | null
          product_id?: number | null
          nama_produk: string
          harga_satuan: number
          qty: number
          subtotal: number
        }
        Update: {
          id?: number
          transaction_id?: number | null
          product_id?: number | null
          nama_produk?: string
          harga_satuan?: number
          qty?: number
          subtotal?: number
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          id: number
          product_id: number | null
          user_id: string | null
          jenis: JenisAdjustment
          jumlah_sebelum: number
          jumlah_perubahan: number
          jumlah_sesudah: number
          keterangan: string | null
          reference_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          product_id?: number | null
          user_id?: string | null
          jenis: JenisAdjustment
          jumlah_sebelum: number
          jumlah_perubahan: number
          jumlah_sesudah: number
          keterangan?: string | null
          reference_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          product_id?: number | null
          user_id?: string | null
          jenis?: JenisAdjustment
          jumlah_sebelum?: number
          jumlah_perubahan?: number
          jumlah_sesudah?: number
          keterangan?: string | null
          reference_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: number
          key: string
          value: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          key: string
          value?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          key?: string
          value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      products_with_category: {
        Row: {
          id: number | null
          sku: string | null
          barcode: string | null
          nama: string | null
          deskripsi: string | null
          category_id: number | null
          satuan: SatuanType | null
          harga_beli: number | null
          harga_jual: number | null
          stok: number | null
          stok_minimum: number | null
          foto_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          category_nama: string | null
          stok_status: StokStatus | null
        }
        Relationships: []
      }
      transactions_with_kasir: {
        Row: {
          id: number | null
          nomor_nota: string | null
          kasir_id: string | null
          subtotal: number | null
          diskon_persen: number | null
          diskon_amount: number | null
          ppn_persen: number | null
          ppn_amount: number | null
          total: number | null
          metode_bayar: MetodeBayar | null
          uang_diterima: number | null
          kembalian: number | null
          catatan: string | null
          status: StatusTransaksi | null
          created_at: string | null
          kasir_nama: string | null
          jumlah_item: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_transaction_atomic: {
        Args: {
          p_items: string
          p_kasir_id: string
          p_subtotal: number
          p_diskon_persen: number
          p_diskon_amount: number
          p_ppn_persen: number
          p_ppn_amount: number
          p_total: number
          p_metode_bayar: MetodeBayar
          p_uang_diterima: number | null
          p_kembalian: number | null
          p_catatan: string | null
        }
        Returns: {
          transaction_id: number
          nomor_nota: string
        }
      }
      generate_nomor_nota: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_penjualan_hari_ini: number
          jumlah_transaksi_hari_ini: number
          jumlah_produk_stok_menipis: number
          produk_terlaris_hari_ini: {
            product_id: number | null
            nama: string | null
            qty: number
          } | null
        }
      }
      get_sales_by_date: {
        Args: {
          date_from: string
          date_to: string
        }
        Returns: {
          tanggal: string
          total_penjualan: number
          jumlah_transaksi: number
        }[]
      }
    }
    Enums: {
      user_role: UserRole
      satuan_type: SatuanType
      metode_bayar: MetodeBayar
      status_transaksi: StatusTransaksi
      jenis_adjustment: JenisAdjustment
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionItem = Database['public']['Tables']['transaction_items']['Row']
export type StockAdjustment = Database['public']['Tables']['stock_adjustments']['Row']
export type StoreSetting = Database['public']['Tables']['store_settings']['Row']
export type ProductWithCategory =
  Database['public']['Views']['products_with_category']['Row']
export type TransactionWithKasir =
  Database['public']['Views']['transactions_with_kasir']['Row']
