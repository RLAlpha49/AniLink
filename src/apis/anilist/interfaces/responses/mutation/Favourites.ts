import { type Title, TitleSchema } from '../../Title'

/**
 * `Favourites` is an interface that contains the favourites of a user.
 * It includes the anime, manga, characters, staff, and studios that are favourited.
 */
export interface Favourites {
  anime: {
    edges: Array<{
      id: number
      node: {
        id: number
        title: Title
      }
    }>
    nodes: Array<{
      id: number
      title: Title
    }>
  }
  manga: {
    edges: Array<{
      id: number
      node: {
        id: number
        title: Title
      }
    }>
    nodes: Array<{
      id: number
      title: Title
    }>
  }
  characters: {
    edges: Array<{
      id: number
      node: {
        id: number
        name: {
          full: string
        }
      }
    }>
    nodes: Array<{
      id: number
      name: {
        full: string
      }
    }>
  }
  staff: {
    edges: Array<{
      id: number
      node: {
        id: number
        name: {
          full: string
        }
      }
    }>
    nodes: Array<{
      id: number
      name: {
        full: string
      }
    }>
  }
  studios: {
    edges: Array<{
      id: number
      node: {
        id: number
        name: string
      }
    }>
    nodes: Array<{
      id: number
      name: string
    }>
  }
}

/**
 * `FavouritesSchema` is a constant representing the GraphQL schema for a favourites query.
 * It includes the anime, manga, characters, staff, and studios schema.
 */
export const FavouritesSchema = `
  anime {
    edges {
      id
      node {
        id
        ${TitleSchema}
      }
    }
    nodes {
      id
      ${TitleSchema}
    }
  }
  manga {
    edges {
      id
      node {
        id
        ${TitleSchema}
      }
    }
    nodes {
      id
      ${TitleSchema}
    }
  }
  characters {
    edges {
      id
      node {
        id
        name {
          full
        }
      }
    }
    nodes {
      id
      name {
        full
      }
    }
  }
  staff {
    edges {
      id
      node {
        id
        name {
          full
        }
      }
    }
    nodes {
      id
      name {
        full
      }
    }
  }
  studios {
    edges {
      id
      node {
        id
        name
      }
    }
    nodes {
      id
      name
    }
  }
`
