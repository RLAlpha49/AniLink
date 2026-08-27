import { TitleSchema } from "../../Title";

/**
 * {@link FavouritesSchema} is a constant representing the GraphQL schema for a favourites query.
 * It includes the anime, manga, characters, staff, and studios schema.
 * @see https://docs.anilist.co/reference/object/favourites
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
`;
