import { AgentGetOne } from "../../types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { agentsInsertSchema } from "../../schemas"
import { useForm } from "react-hook-form"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { GeneratedAvatar } from "@/components/generated-avatar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormField,
} from "@/components/ui/form"
import { toast } from "sonner"

interface AgentFormProps {
    onSuccess?: ()=> void
    onCancel?: () => void
    initialValues?: AgentGetOne
}

export const AgentForm = ({ onSuccess, onCancel, initialValues }: AgentFormProps) => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const createAgent = useMutation(trpc.agents.create.mutationOptions({
        onSuccess: async () => {
           await queryClient.invalidateQueries(
                trpc.agents.getMany.queryOptions({}),
            )
                onSuccess?.()
        },
        onError: (error) => {
            toast.error(error.message)
        }
    }))

    const updateAgent = useMutation(trpc.agents.update.mutationOptions({
        onSuccess: async () => {
           await queryClient.invalidateQueries(
                trpc.agents.getMany.queryOptions({}),
            )
              if(initialValues?.id) {
              await queryClient.invalidateQueries(
                    trpc.agents.getOne.queryOptions({ id: initialValues.id }),
                )
              }
                onSuccess?.()
        },
        onError: (error) => {
            toast.error(error.message)
        }
    }))


    const form = useForm<z.infer<typeof agentsInsertSchema>>({
        resolver: zodResolver(agentsInsertSchema),
        defaultValues: {
            name: initialValues?.name ?? "",
            instructions : initialValues?.instructions ?? "",
        }
    })
      const isEdit = !!initialValues?.id
      const isPending = createAgent.isPending || updateAgent.isPending

      const onSubmit = (values: z.infer<typeof agentsInsertSchema>) => {
        if(isEdit) {
            updateAgent.mutate({ ...values, id: initialValues.id })
        } else {
            createAgent.mutate(values)
        }
      }

        return (
            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <GeneratedAvatar 
                      seed={form.watch("name")}
                      variant="botttsNeutral"
                      className="border size-16"
                    />
                    <FormField
                        control={form.control} 
                        name='name'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. Math tutor" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        
                       />
                        <FormField
                        control={form.control} 
                        name='instructions'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instructions</FormLabel>
                                <FormControl>
                                    <Textarea {...field} placeholder="You are a helpful math assistant that can answer questions and help with assignments." />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        
                       />
                       <div className="flex justify-between gap-x-2">
                         {onCancel && (
                            <Button variant="ghost" type="button" onClick={onCancel} disabled={isPending}>
                                Cancel
                            </Button>
                         )}
                         <Button type="submit" disabled={isPending}>
                             {isEdit ? "Update" : "Create"}</Button>
                       </div>
                </form>
            </Form>

        )
}
