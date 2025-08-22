// import React from 'react'

// const MovieCard = ({ movie:
//   { title, vote_average, poster_path, release_date, original_language }
// }) => {
//   return (
//     <div className="movie-card">
//       <img
//         src={poster_path ?
//           `https://image.tmdb.org/t/p/w500/${poster_path}` : '/no-movie.png'}
//         alt={title}
//       />

//       <div className="mt-4">
//         <h3>{title}</h3>

//         <div className="content">
//           <div className="rating">
//             <img src="star.svg" alt="Star Icon" />
//             <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>
//           </div>

//           <span>•</span>
//           <p className="lang">{original_language}</p>

//           <span>•</span>
//           <p className="year">
//             {release_date ? release_date.split('-')[0] : 'N/A'}
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }
// export default MovieCard


import React from 'react'

const MovieCard = ({ movie:
  { title, vote_average, poster_path, release_date, original_language }
}) => {
  // build poster url (poster_path usually starts with '/')
  const posterUrl = poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : '/no-movie.png'
  const year = release_date ? release_date.split('-')[0] : 'N/A'
  const lang = original_language ? original_language.toUpperCase() : 'N/A'

  return (
    <div className="movie-card bg-neutral-900 rounded-2xl p-3 shadow-lg">
      <img
        src={posterUrl}
        alt={title}
        className="w-full h-[320px] object-cover rounded-lg"
      />

      <div className="mt-4">
        <h3 className="text-white font-semibold text-sm md:text-base truncate">{title}</h3>

        {/* Rating / Language / Year row */}
        <div className="flex items-center gap-3 mt-2">
          {/* Rating badge */}
          <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-600/20 text-yellow-400 px-2 py-1 rounded-md">
            <img src="/star.svg" alt="Star" className="w-4 h-4" />
            <p className="text-yellow-400 font-semibold text-sm">
              {vote_average ? vote_average.toFixed(1) : 'N/A'}
            </p>
          </div>

          {/* Language and Year chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/5 text-gray-200 px-2 py-1 rounded-md font-medium">
              {lang}
            </span>

            <span className="text-xs bg-white/5 text-gray-200 px-2 py-1 rounded-md font-medium">
              {year}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MovieCard
