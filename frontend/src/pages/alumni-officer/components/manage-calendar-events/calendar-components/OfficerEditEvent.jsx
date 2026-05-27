import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import OfficerCalendarForm from "./OfficerCalendarForm.jsx";

export default function OfficerEditEvent({
  open,
  onOpenChange,
  selectedDate,
  onCreated,
  initialData,
  editingId,
}) {
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [submitRef, setSubmitRef] = useState(() => async () => {});
  const dialogLayerRef = useRef(null);

  function handleRequestClose() {
    setOpenCloseDialog(true);
  }

  function handleConfirmClose() {
    setOpenCloseDialog(false);
    setOpenUpdateDialog(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            handleRequestClose();
            return;
          }

          onOpenChange(true);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-7xl">
          <div
            ref={dialogLayerRef}
            className="relative overflow-visible px-6 py-6"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#3D398C]">
                Edit Event
              </DialogTitle>
              <DialogDescription>
                Update the alumni calendar event details.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 overflow-visible">
              <OfficerCalendarForm
                mode="edit"
                selectedDate={selectedDate}
                initialData={initialData}
                editingId={editingId}
                onCreated={onCreated}
                onClose={handleRequestClose}
                finalButtonLabel="Update Event"
                getTimePickerContainer={() => dialogLayerRef.current}
                onFinalSubmit={(submitFn) => {
                  setSubmitRef(() => submitFn);
                  setOpenUpdateDialog(true);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openUpdateDialog} onOpenChange={setOpenUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save your latest changes to the event.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await submitRef("update");
              }}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              Update Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openCloseDialog} onOpenChange={setOpenCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              Any unsaved changes in this event form will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}