// Satu sumber base URL API untuk seluruh aplikasi.
// Ambil dari .env (VITE_API_URL). Kalau tidak di-set, fallback ke default di bawah.
// Ubah cukup di SATU tempat ini (atau di .env) kalau backend pindah port/host.
export const API_URL: string =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";
