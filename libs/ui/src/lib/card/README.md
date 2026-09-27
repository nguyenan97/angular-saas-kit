# Card

A raised surface that groups related content. The parts are directives on elements you
choose, so the heading level and the landmarks stay yours.

```html
<ask-card>
  <header askCardHeader>
    <h2 askCardTitle>Revenue</h2>
    <p askCardDescription>Last 30 days</p>
  </header>
  <div askCardContent>$48,120</div>
  <footer askCardFooter>
    <a askButton variant="link" href="/analytics">Details</a>
  </footer>
</ask-card>
```

| Part              | Selector               | Styles                                  |
| ----------------- | ---------------------- | --------------------------------------- |
| `Card`            | `ask-card`             | The surface: card tokens, border        |
| `CardHeader`      | `[askCardHeader]`      | A column with the title and description |
| `CardTitle`       | `[askCardTitle]`       | The title                               |
| `CardDescription` | `[askCardDescription]` | Secondary text                          |
| `CardContent`     | `[askCardContent]`     | The body                                |
| `CardFooter`      | `[askCardFooter]`      | A row of actions                        |

Each takes a `class` input, merged last so it wins.

## Accessibility

- **Pick the heading level for the page:** the card cannot know where it sits in the
  outline. In the dashboard the topbar holds the page's `h1`, so a card on a page starts at
  `h2`.
- A card is not interactive. If the whole card should be a link, put the link on the title
  and let the rest of the card be text, rather than wrapping everything in an `<a>`.
