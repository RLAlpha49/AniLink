export interface Activity {
  TextActivity: {
    id: number
    type: string
  }
  ListActivity: {
    id: number
    type: string
  }
  MessageActivity: {
    id: number
    type: string
  }
}

export const ActivitySchema = `
  activity {
    ... on TextActivity {
      id
      type
    }
    ... on ListActivity {
      id
      type
    }
    ... on MessageActivity {
      id
      type
    }
  }
`
