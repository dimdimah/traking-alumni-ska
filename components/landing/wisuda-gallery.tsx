import Image from 'next/image'

const WISUDA_PHOTOS = [
  { src: '/image1.png', alt: 'Penyerahan Ijazah Wisuda XXIII STMIK AMIKOM Surakarta' },
  { src: '/image2.jpeg', alt: 'Sidang Senat Wisuda XXIII STMIK AMIKOM Surakarta' },
  { src: '/image3.jpeg', alt: 'Foto Bersama Wisudawan STMIK AMIKOM Surakarta' },
  { src: '/image4.jpeg', alt: 'Para Wisudawan Cumlaude STMIK AMIKOM Surakarta' },
  { src: '/image5.jpeg', alt: 'Prosesi Wisuda STMIK AMIKOM Surakarta' },
]

// 4x duplikasi per track (20 foto) menghasilkan lebar >3.000px sehingga layar ultra-wide & 4K selalu terisi penuh tanpa ruang kosong
const TRACK_ITEMS = [
  ...WISUDA_PHOTOS,
  ...WISUDA_PHOTOS,
  ...WISUDA_PHOTOS,
  ...WISUDA_PHOTOS,
]

export function WisudaGallery() {
  return (
    <section className="bg-amikom-purple py-5 sm:py-6 overflow-hidden select-none" aria-label="Galeri Foto Wisuda">
      <div className="wisuda-marquee-wrapper">
        {/* Track 1 */}
        <div className="wisuda-marquee-track">
          {TRACK_ITEMS.map((photo, idx) => (
            <div
              key={`track1-${idx}`}
              className="relative flex-shrink-0 h-[105px] w-[160px] sm:h-[125px] sm:w-[190px] md:h-[135px] md:w-[205px] rounded-xl overflow-hidden border border-white/20 shadow-md transition-transform duration-300 hover:scale-105"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 160px, (max-width: 768px) 190px, 205px"
              />
            </div>
          ))}
        </div>

        {/* Track 2 (Duplikasi identik untuk infinite seamless loop tanpa jeda) */}
        <div className="wisuda-marquee-track" aria-hidden="true">
          {TRACK_ITEMS.map((photo, idx) => (
            <div
              key={`track2-${idx}`}
              className="relative flex-shrink-0 h-[105px] w-[160px] sm:h-[125px] sm:w-[190px] md:h-[135px] md:w-[205px] rounded-xl overflow-hidden border border-white/20 shadow-md transition-transform duration-300 hover:scale-105"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 160px, (max-width: 768px) 190px, 205px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
