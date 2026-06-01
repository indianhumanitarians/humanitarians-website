import { Button } from "../common/Button";

export const AdminTopActions = () => (
  <>
    <Button to="/admin/cases/new" variant="secondary">
      Add case
    </Button>
    <Button to="/admin/testimonials/new" variant="secondary">
      Add testimonial
    </Button>
  </>
);
