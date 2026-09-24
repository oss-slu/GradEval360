import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GoalInputProps = {
    goals: string[],
    onChange: (goals: string[]) => void,
    maxGoals: number,
    placeholder: string,

}
export default function GoalsInput({
    goals,
    onChange,
    maxGoals,
    placeholder,
}: GoalInputProps) {
    function updateGoal(index: number, value: string) {
        const updatedGoals = goals.map((goal, i) =>  i === index ? value : goal);

        onChange(updatedGoals);
    }

    function addGoal() {
        if (goals.length > maxGoals) return;

        onChange([...goals, ""]);
    }

    function removeGoal(index: number) {
        const updatedGoals = goals.filter(((_, i) => i !== index));

        onChange(updatedGoals.length > 0 ? updatedGoals : [""]);
    }

    return (
    <div className="space-y-4">
      {goals.map((goal, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Goal {index + 1}</p>

            {goals.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeGoal(index)}
              >
                Remove
              </Button>
            )}
          </div>

          <Input
            value={goal}
            onChange={(event) => updateGoal(index, event.target.value)}
            placeholder={placeholder}
            maxLength={200}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addGoal}
        disabled={goals.length >= maxGoals}
      >
        Add goal
      </Button>
    </div>
  );
}