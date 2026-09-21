import { everyFactorIsUnverified } from '@/engine/production-factors'
import { WorkItemForm } from '@/ui/work-item-form'

export default function HomePage() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">What do I need to buy?</h2>

      {everyFactorIsUnverified() ? (
        <div
          role="note"
          className="rounded border-2 border-danger bg-paper-raised p-3 text-sm"
        >
          <p className="font-bold text-danger">Placeholder factors. Do not price real work.</p>
          <p className="mt-1">
            Not one factor in this build has been checked against a reference book, so
            every line below is marked <strong>unverified</strong>. The arithmetic is
            right; the numbers it multiplies are not yet anyone&rsquo;s.
          </p>
        </div>
      ) : null}

      <WorkItemForm />
    </section>
  )
}
