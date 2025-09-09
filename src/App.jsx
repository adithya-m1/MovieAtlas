import { useEffect, useState } from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx'
import MovieCard from './components/MovieCard.jsx'
import { useDebounce } from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js'

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

// --- helpers ---
const buildPosterUrl = (movie) => {
  if (!movie) return '/no-movie.png'
  if (movie.poster_url) return movie.poster_url
  if (movie.poster_path) return `https://image.tmdb.org/t/p/w500${movie.poster_path}`
  return '/no-movie.png'
}

const posterPathFromFullUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const idx = url.indexOf('/t/p/')
  if (idx === -1) return null
  const after = idx + '/t/p/'.length
  const nextSlash = url.indexOf('/', after)
  if (nextSlash === -1) return null
  return url.substring(nextSlash)
}

// --- helpers for redirect ---
const googleSearchUrl = (title) => {
  if (!title) return 'https://www.google.com'
  return `https://www.google.com/search?q=${encodeURIComponent(title)}+movie`
}

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [movieList, setMovieList] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [trendingMovies, setTrendingMovies] = useState([])
  const [apiTrendingMovies, setApiTrendingMovies] = useState([])

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async (query = '') => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`

      const response = await fetch(endpoint, API_OPTIONS)
      if (!response.ok) throw new Error('Failed to fetch movies')

      const data = await response.json()
      if (data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies')
        setMovieList([])
        return
      }

      setMovieList(data.results || [])

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0])
      }
    } catch (error) {
      console.error('Error fetching movies:', error)
      setErrorMessage('Error fetching movies. Please try again later.')
      setMovieList([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const docs = await getTrendingMovies()
      if (!Array.isArray(docs) || docs.length === 0) {
        setTrendingMovies([])
        return
      }

      const enriched = await Promise.all(
        docs.map(async (doc) => {
          if (doc.movie_id) {
            try {
              const res = await fetch(`${API_BASE_URL}/movie/${doc.movie_id}`, API_OPTIONS)
              if (!res.ok) throw new Error('TMDB detail fetch failed')
              const details = await res.json()
              return {
                poster_url: doc.poster_url ?? null,
                poster_path: details.poster_path ?? posterPathFromFullUrl(doc.poster_url),
                title: details.title ?? doc.searchTerm ?? 'Unknown',
                _id: doc.$id ?? null
              }
            } catch {
              return {
                poster_url: doc.poster_url ?? null,
                poster_path: posterPathFromFullUrl(doc.poster_url),
                title: doc.searchTerm ?? 'Unknown',
                _id: doc.$id ?? null
              }
            }
          } else {
            return {
              poster_url: doc.poster_url ?? null,
              poster_path: posterPathFromFullUrl(doc.poster_url),
              title: doc.searchTerm ?? 'Unknown',
              _id: doc.$id ?? null
            }
          }
        })
      )

      setTrendingMovies(enriched)
    } catch (error) {
      console.error('Error fetching trending movies:', error)
      setTrendingMovies([])
    }
  }

  const loadApiTrendingMovies = async () => {
    try {
      const endpoint = `${API_BASE_URL}/trending/movie/day`
      const response = await fetch(endpoint, API_OPTIONS)
      if (!response.ok) throw new Error('Failed to fetch trending movies from API')
      const data = await response.json()
      setApiTrendingMovies((data.results || []).slice(0, 10))
    } catch (error) {
      console.error('Error fetching API trending movies:', error)
      setApiTrendingMovies([])
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies()
    loadApiTrendingMovies()
  }, [])

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {/* COMMUNITY TRENDING */}
        {Array.isArray(trendingMovies) && trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies (Community)</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie._id || `community-${index}`}>
                  <p>{index + 1}</p>
                  <a href={googleSearchUrl(movie.title)} target="_blank" rel="noopener noreferrer">
                    <img src={buildPosterUrl(movie)} alt={movie.title || ''} />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* API TRENDING */}
        {Array.isArray(apiTrendingMovies) && apiTrendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies (Globally)</h2>
            <ul>
              {apiTrendingMovies.map((movie, index) => (
                <li key={movie.id}>
                  <p>{index + 1}</p>
                  <a href={googleSearchUrl(movie.title)} target="_blank" rel="noopener noreferrer">
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                          : '/no-movie.png'
                      }
                      alt={movie.title || ''}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* MAIN MOVIE SECTION */}
        <section className="all-movies">
          <h2>All Movies</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 20,
                listStyle: 'none',
                padding: 0
              }}
            >
              {movieList.map((movie) => (
                <li key={movie.id}>
                  <a href={googleSearchUrl(movie.title)} target="_blank" rel="noopener noreferrer">
                    <MovieCard movie={movie} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
