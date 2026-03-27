import { create } from 'zustand'
import type { CartItem, CartState } from '../types'
import type { MetodeBayar, ProductWithCategory } from '../types/database'

interface CartStore extends CartState {
  ppn_persen: number
  addItem: (product: ProductWithCategory) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  clearCart: () => void
  setDiskon: (persen: number) => void
  togglePPN: () => void
  setPpnPersen: (persen: number) => void
  setMetodeBayar: (metode: MetodeBayar) => void
  setUangDiterima: (amount: number) => void
}

function calculateCartState(state: Pick<CartStore, 'items' | 'diskon_persen' | 'use_ppn' | 'ppn_persen' | 'uang_diterima'>) {
  const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0)
  const diskonAmount = Math.round(subtotal * (state.diskon_persen / 100))
  const taxableAmount = Math.max(subtotal - diskonAmount, 0)
  const ppnAmount = state.use_ppn ? Math.round(taxableAmount * (state.ppn_persen / 100)) : 0
  const total = taxableAmount + ppnAmount
  const kembalian = Math.max(state.uang_diterima - total, 0)

  return {
    subtotal,
    diskon_amount: diskonAmount,
    ppn_amount: ppnAmount,
    total,
    kembalian,
  }
}

function mapProductToCartItem(product: ProductWithCategory): CartItem {
  return {
    product_id: product.id ?? 0,
    sku: product.sku,
    nama_produk: product.nama ?? 'Produk',
    harga_satuan: Number(product.harga_jual ?? 0),
    qty: 1,
    subtotal: Number(product.harga_jual ?? 0),
    stok_tersedia: Number(product.stok ?? 0),
    satuan: product.satuan ?? 'pcs',
    foto_url: product.foto_url,
  }
}

function withRecalculatedState(partialState: Partial<CartStore>, currentState: CartStore) {
  const mergedState = {
    ...currentState,
    ...partialState,
  }

  return {
    ...partialState,
    ...calculateCartState(mergedState),
  }
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  diskon_persen: 0,
  use_ppn: false,
  metode_bayar: 'tunai',
  uang_diterima: 0,
  subtotal: 0,
  diskon_amount: 0,
  ppn_amount: 0,
  total: 0,
  kembalian: 0,
  ppn_persen: 0,

  addItem: (product) => {
    const currentState = get()
    const productId = product.id ?? 0

    if (!productId) {
      throw new Error('Produk tidak valid')
    }

    const stokTersedia = Number(product.stok ?? 0)

    if (stokTersedia <= 0) {
      throw new Error(`Stok ${product.nama ?? 'produk'} sudah habis`)
    }

    const existingItem = currentState.items.find((item) => item.product_id === productId)

    if (existingItem) {
      if (existingItem.qty >= existingItem.stok_tersedia) {
        throw new Error(`Qty ${existingItem.nama_produk} melebihi stok`)
      }

      const nextItems = currentState.items.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              qty: item.qty + 1,
              subtotal: (item.qty + 1) * item.harga_satuan,
            }
          : item,
      )

      set(withRecalculatedState({ items: nextItems }, currentState))
      return
    }

    const nextItems = [...currentState.items, mapProductToCartItem(product)]
    set(withRecalculatedState({ items: nextItems }, currentState))
  },

  removeItem: (productId) => {
    const currentState = get()
    const nextItems = currentState.items.filter((item) => item.product_id !== productId)
    set(withRecalculatedState({ items: nextItems }, currentState))
  },

  updateQty: (productId, qty) => {
    const currentState = get()
    const targetItem = currentState.items.find((item) => item.product_id === productId)

    if (!targetItem) {
      return
    }

    if (qty <= 0) {
      const nextItems = currentState.items.filter((item) => item.product_id !== productId)
      set(withRecalculatedState({ items: nextItems }, currentState))
      return
    }

    if (qty > targetItem.stok_tersedia) {
      throw new Error(`Qty ${targetItem.nama_produk} melebihi stok`)
    }

    const nextItems = currentState.items.map((item) =>
      item.product_id === productId
        ? {
            ...item,
            qty,
            subtotal: qty * item.harga_satuan,
          }
        : item,
    )

    set(withRecalculatedState({ items: nextItems }, currentState))
  },

  clearCart: () =>
    set({
      items: [],
      diskon_persen: 0,
      use_ppn: false,
      metode_bayar: 'tunai',
      uang_diterima: 0,
      subtotal: 0,
      diskon_amount: 0,
      ppn_amount: 0,
      total: 0,
      kembalian: 0,
      ppn_persen: 0,
    }),

  setDiskon: (persen) => {
    const currentState = get()
    const normalizedValue = Number.isFinite(persen) ? Math.min(Math.max(persen, 0), 100) : 0
    set(withRecalculatedState({ diskon_persen: normalizedValue }, currentState))
  },

  togglePPN: () => {
    const currentState = get()
    set(withRecalculatedState({ use_ppn: !currentState.use_ppn }, currentState))
  },

  setPpnPersen: (persen) => {
    const currentState = get()
    const normalizedValue = Number.isFinite(persen) ? Math.max(persen, 0) : 0
    set(
      withRecalculatedState(
        {
          ppn_persen: normalizedValue,
          use_ppn: normalizedValue > 0 ? currentState.use_ppn : false,
        },
        currentState,
      ),
    )
  },

  setMetodeBayar: (metode) => set({ metode_bayar: metode }),

  setUangDiterima: (amount) => {
    const currentState = get()
    const normalizedValue = Number.isFinite(amount) ? Math.max(amount, 0) : 0
    set(withRecalculatedState({ uang_diterima: normalizedValue }, currentState))
  },
}))
